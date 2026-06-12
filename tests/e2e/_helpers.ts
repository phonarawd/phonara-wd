import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Page } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// E2E runs against the LOCAL Supabase stack (supabase start). The service-role
// key must come from the local environment so no secret-shaped value is stored
// in git history or shipped to GitHub.
export const SUPABASE_URL = process.env['VITE_SUPABASE_URL'] ?? 'http://127.0.0.1:54444';
export const ANON_KEY =
  process.env['VITE_SUPABASE_ANON_KEY'] ?? 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

function readLocalServiceKey(): string | undefined {
  const result = spawnSync('supabase', ['status', '-o', 'env'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) return undefined;

  const values = new Map<string, string>();
  for (const line of result.stdout.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=['"]?(.+?)['"]?$/);
    if (match) values.set(match[1]!, match[2]!);
  }

  return values.get('SECRET_KEY') ?? values.get('SUPABASE_SERVICE_ROLE_KEY') ?? values.get('SERVICE_ROLE_KEY');
}

export const SERVICE_ROLE_KEY = (
  process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? process.env['SUPABASE_SECRET_KEY'] ?? readLocalServiceKey()
)?.replace(/^['"]|['"]$/g, '');

if (!SERVICE_ROLE_KEY) {
  throw new Error('A local Supabase service key is required for E2E tests.');
}

export const AUTH_FILE = join('tests', 'e2e', '.auth.json');
export const ADMIN_AUTH_FILE = join('tests', 'e2e', '.admin-auth.json');

export interface E2EAuth {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

/** Service-role client (bypasses RLS) for fixtures + invariant assertions. */
export function adminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function readAuth(): E2EAuth {
  return JSON.parse(readFileSync(AUTH_FILE, 'utf8')) as E2EAuth;
}

export function readAdminAuth(): E2EAuth {
  return JSON.parse(readFileSync(ADMIN_AUTH_FILE, 'utf8')) as E2EAuth;
}

interface BrowserSessionOptions {
  postLoginPath?: string | null;
  unregisterServiceWorkers?: boolean;
}

/**
 * Inject a real local Supabase session into the browser. Windows Chromium can
 * occasionally leave local Auth fetches pending, so the browser-side calls are
 * bounded and retried. This only isolates session setup; money/security specs
 * still execute their database invariant assertions.
 */
export async function injectBrowserSession(
  page: Page,
  accessToken: string,
  refreshToken: string,
  options: BrowserSessionOptions = {},
): Promise<void> {
  const { postLoginPath = null, unregisterServiceWorkers = false } = options;
  let lastError = 'session injection did not run';

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await page.goto('/login', { waitUntil: 'commit', timeout: 15_000 });

    if (unregisterServiceWorkers) {
      await page.evaluate(async () => {
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((registration) => registration.unregister()));
        }
      });
    }

    await page.waitForFunction(
      () => Boolean((window as unknown as { __supabase?: unknown }).__supabase),
      undefined,
      { timeout: 10_000 },
    );

    const errMsg = await page.evaluate(
      async ([at, rt]) => {
        const sb = (
          window as unknown as {
            __supabase: {
              auth: {
                setSession: (a: { access_token: string; refresh_token: string }) => Promise<{
                  error: { message?: string } | null;
                }>;
                getSession: () => Promise<{ data: { session: { user: { id: string } } | null } }>;
              };
            };
          }
        ).__supabase;

        const timeout = (label: string) =>
          new Promise<string>((resolve) => {
            window.setTimeout(() => resolve(`${label} timed out`), 5_000);
          });

        const setResult = await Promise.race([
          sb.auth
            .setSession({ access_token: at, refresh_token: rt })
            .then(({ error }) => (error ? (error.message ?? 'setSession failed') : null))
            .catch((err: unknown) => (err instanceof Error ? err.message : String(err))),
          timeout('setSession'),
        ]);
        if (setResult) return setResult;

        const sessionResult = await Promise.race([
          sb.auth
            .getSession()
            .then(({ data }) => (data.session?.user.id ? null : 'session missing after setSession'))
            .catch((err: unknown) => (err instanceof Error ? err.message : String(err))),
          timeout('getSession'),
        ]);
        return sessionResult;
      },
      [accessToken, refreshToken] as const,
    );

    if (errMsg === null) {
      if (postLoginPath) await page.goto(postLoginPath, { waitUntil: 'commit', timeout: 15_000 });
      return;
    }

    lastError = String(errMsg);
    if (attempt < 3) await page.waitForTimeout(500 * attempt);
  }

  throw new Error(`setSession should succeed after retries: ${lastError}`);
}

/**
 * Global conservation totals: Σ(all user wallets) + Σ(system accounts) per
 * currency. The platform invariant (rule 30/25) is that these are unchanged by
 * any user money operation, since every leg nets to zero across user + system.
 */
export function currencyTotals(_admin: SupabaseClient): { USDT: string; PHON: string } {
  void _admin;

  const sql = `
    WITH wallet_totals AS (
      SELECT
        COALESCE(SUM(usdt_available::numeric + usdt_locked::numeric), 0)::numeric AS usdt,
        COALESCE(SUM(phon_available::numeric + phon_locked::numeric), 0)::numeric AS phon
      FROM public.wallets
    ),
    system_totals AS (
      SELECT
        COALESCE(SUM(balance::numeric) FILTER (WHERE currency = 'USDT'), 0)::numeric AS usdt,
        COALESCE(SUM(balance::numeric) FILTER (WHERE currency = 'PHON'), 0)::numeric AS phon
      FROM public.system_accounts
    )
    SELECT
      to_char(wallet_totals.usdt + system_totals.usdt, 'FM999999999999999999990.000000'),
      to_char(wallet_totals.phon + system_totals.phon, 'FM999999999999999999990.000000')
    FROM wallet_totals, system_totals;
  `;
  const result = spawnSync(
    'docker',
    [
      'exec',
      '-i',
      'supabase_db_yocjhjsdwoijfdrehzoq',
      'psql',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-At',
      '-v',
      'ON_ERROR_STOP=1',
      '-F',
      ',',
    ],
    { input: sql, encoding: 'utf8' },
  );

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'currency totals SQL failed');
  }

  const [usdt, phon] = result.stdout.trim().split(',');
  if (!usdt || !phon) {
    throw new Error('currency totals SQL returned no row');
  }
  return { USDT: usdt, PHON: phon };
}

function sqlLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

export function gameBetCount(userId: string): number {
  const sql = `
    SELECT COUNT(*)::int
    FROM public.game_bets
    WHERE user_id = ${sqlLiteral(userId)};
  `;
  const result = spawnSync(
    'docker',
    [
      'exec',
      '-i',
      'supabase_db_yocjhjsdwoijfdrehzoq',
      'psql',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-At',
      '-v',
      'ON_ERROR_STOP=1',
    ],
    { input: sql, encoding: 'utf8' },
  );

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'game bet count SQL failed');
  }

  const count = Number(result.stdout.trim());
  if (!Number.isInteger(count)) {
    throw new Error('game bet count SQL returned invalid output');
  }
  return count;
}

export function fundE2EWallet(
  userId: string,
  balances: { phon?: string; usdt?: string },
): void {
  const assignments = [
    balances.phon === undefined ? null : `phon_available = ${sqlLiteral(balances.phon)}`,
    balances.usdt === undefined ? null : `usdt_available = ${sqlLiteral(balances.usdt)}`,
  ].filter((value): value is string => value !== null);

  if (assignments.length === 0) return;

  const sql = `
    BEGIN;
    SELECT set_config('phonara.ledger_write', 'allowed', true);
    UPDATE public.wallets
       SET ${assignments.join(', ')}
     WHERE user_id = ${sqlLiteral(userId)}
    RETURNING user_id;
    COMMIT;
  `;
  const result = spawnSync(
    'docker',
    [
      'exec',
      '-i',
      'supabase_db_yocjhjsdwoijfdrehzoq',
      'psql',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-At',
      '-v',
      'ON_ERROR_STOP=1',
    ],
    { input: sql, encoding: 'utf8' },
  );

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'fund wallet SQL failed');
  }
  if (!result.stdout.includes(userId)) {
    throw new Error('fund wallet failed: 0 rows updated');
  }
}

/** Canonical local-stack oracle prices used by E2E preflight (matches migration seeds). */
export const E2E_ORACLE_PRICES: Readonly<Record<string, string>> = {
  PHON_USDT: '0.010000',
  'PHONUSDT-PERP': '0.010000',
  'BTCUSDT-SIM': '68000.000000',
  'ETHUSDT-SIM': '3500.000000',
};

export const E2E_TRADING_SYMBOLS = Object.keys(E2E_ORACLE_PRICES);

/**
 * Restore oracle prices + freshness and clear circuit-breaker halts.
 * Prior money/liquidation specs can leave PHONUSDT-PERP at 0, which disables
 * futures preview and synthetic order book (`no_price`) until reset.
 */
export async function resetE2EOracleState(admin: SupabaseClient): Promise<void> {
  const now = new Date().toISOString();
  for (const [symbol, price] of Object.entries(E2E_ORACLE_PRICES)) {
    let lastError = 'update did not run';
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const { error } = await admin
        .from('oracle_prices')
        .update({ price, updated_at: now })
        .eq('symbol', symbol);
      if (!error) {
        lastError = '';
        break;
      }
      lastError = error.message;
      await new Promise<void>((resolve) => setTimeout(resolve, 250 * attempt));
    }
    if (lastError) throw new Error(`reset oracle ${symbol} failed: ${lastError}`);
  }
  let cbLast = 'update did not run';
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const { error: cbErr } = await admin
      .from('market_circuit_breakers')
      .update({ is_halted: false, staleness_seconds: 86_400 })
      .in('symbol', E2E_TRADING_SYMBOLS);
    if (!cbErr) {
      cbLast = '';
      break;
    }
    cbLast = cbErr.message;
    await new Promise<void>((resolve) => setTimeout(resolve, 250 * attempt));
  }
  if (cbLast) throw new Error(`reset circuit breakers failed: ${cbLast}`);
}

/** Reset oracle freshness so price-staleness guards never trip mid-test. */
export async function freshenOracle(admin: SupabaseClient): Promise<void> {
  await resetE2EOracleState(admin);
}
