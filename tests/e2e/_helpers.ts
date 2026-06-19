import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { expect, type Page } from '@playwright/test';
import { generateSync } from 'otplib';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readLocalSupabaseEnv } from '../../scripts/lib/db-connect';

// E2E runs against the LOCAL Supabase stack (supabase start). The service-role
// key must come from the local environment so no secret-shaped value is stored
// in git history or shipped to GitHub.
export const SUPABASE_URL = process.env['VITE_SUPABASE_URL'] ?? 'http://127.0.0.1:54444';
export const ANON_KEY =
  process.env['VITE_SUPABASE_ANON_KEY'] ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

function readLocalServiceKey(): string | undefined {
  return readLocalSupabaseEnv()?.SUPABASE_SERVICE_ROLE_KEY;
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
  totpSecret?: string;
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

export const ADMIN_BASE = 'http://127.0.0.1:3001';

function resolveAdminTotpSecret(email: string, totpSecret?: string): string | undefined {
  if (totpSecret) return totpSecret;
  const adminAuth = readAdminAuth();
  return adminAuth.email === email ? adminAuth.totpSecret : undefined;
}

/** Password login plus MFA challenge. Global admin TOTP is resolved from `.admin-auth.json`. */
export async function loginAdmin(
  page: Page,
  email: string,
  password: string,
  totpSecret?: string,
): Promise<void> {
  const resolvedTotpSecret = resolveAdminTotpSecret(email, totpSecret);

  await page.goto(`${ADMIN_BASE}/login`);
  await expect(page.getByTestId('admin-login-form')).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('admin-email').fill(email);
  await page.getByTestId('admin-password').fill(password);
  await page.getByTestId('admin-login-submit').click();

  await Promise.race([
    page.getByTestId('admin-mfa-enroll-page').waitFor({ state: 'visible', timeout: 20_000 }),
    page.getByTestId('admin-mfa-challenge-page').waitFor({ state: 'visible', timeout: 20_000 }),
    page.getByTestId('overview-page').waitFor({ state: 'visible', timeout: 20_000 }),
  ]);

  if (await page.getByTestId('admin-mfa-enroll-page').isVisible()) {
    throw new Error(
      `loginAdmin hit MFA enrollment for ${email}; use a fresh-user flow for unenrolled admins`,
    );
  }

  if (await page.getByTestId('admin-mfa-challenge-page').isVisible()) {
    if (!resolvedTotpSecret) {
      throw new Error(`loginAdmin requires a TOTP secret to complete MFA challenge for ${email}`);
    }
    await expect(page.getByTestId('admin-mfa-challenge-code')).toBeVisible({ timeout: 20_000 });
    const code = generateSync({ secret: resolvedTotpSecret });
    await page.getByTestId('admin-mfa-challenge-code').fill(code);
    await page.getByTestId('admin-mfa-challenge-submit').click();
    await expect(page.getByTestId('overview-page')).toBeVisible({ timeout: 20_000 });
    return;
  }

  await expect(page.getByTestId('overview-page')).toBeVisible({ timeout: 20_000 });
}

export interface CurrencyTotals {
  USDT: string;
  PHON: string;
}

/** Per-currency delta between two global conservation snapshots (wallets + system accounts). */
export function conservationDelta(before: CurrencyTotals, after: CurrencyTotals): CurrencyTotals {
  const delta = (start: string, end: string): string =>
    (Number(end) - Number(start)).toFixed(6);
  return { USDT: delta(before.USDT, after.USDT), PHON: delta(before.PHON, after.PHON) };
}

/** Assert this test's operations did not move global Σ (delta = 0 per currency). */
export function assertConservationUnchanged(before: CurrencyTotals, after: CurrencyTotals): void {
  const delta = conservationDelta(before, after);
  expect(delta.USDT).toBe('0.000000');
  expect(delta.PHON).toBe('0.000000');
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
    await page.goto('/login', { waitUntil: 'load', timeout: 30_000 });

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
      { timeout: 30_000 },
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
export function currencyTotals(_admin: SupabaseClient): CurrencyTotals {
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
  const output = dockerPsqlExec(sql, 'currency totals SQL failed', ['-F', ',']);
  const [usdt, phon] = output.split(',');
  if (!usdt || !phon) {
    throw new Error('currency totals SQL returned no row');
  }
  return { USDT: usdt, PHON: phon };
}

function sqlLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function sleepSync(ms: number): void {
  spawnSync('powershell', ['-NoProfile', '-Command', `Start-Sleep -Milliseconds ${ms}`], {
    stdio: 'ignore',
  });
}

/** Docker Desktop on low-spec Windows can hang or return transient 500s — cap wait per attempt. */
const DOCKER_PSQL_TIMEOUT_MS = 20_000;

function dockerPsqlExec(sql: string, errorLabel: string, extraArgs: string[] = []): string {
  const args = [
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
    ...extraArgs,
  ];
  let lastError = errorLabel;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const result = spawnSync('docker', args, {
      input: sql,
      encoding: 'utf8',
      timeout: DOCKER_PSQL_TIMEOUT_MS,
    });
    if (result.status === 0 && result.stdout.trim()) {
      return result.stdout.trim();
    }
    if (result.error?.message.includes('ETIMEDOUT') || result.signal === 'SIGTERM') {
      lastError = `docker psql timed out after ${DOCKER_PSQL_TIMEOUT_MS}ms`;
    } else {
      lastError = result.stderr || result.stdout || errorLabel;
    }
    if (attempt < 3) sleepSync(750 * attempt);
  }
  throw new Error(lastError);
}

export function gameBetCount(userId: string): number {
  const sql = `
    SELECT COUNT(*)::int
    FROM public.game_bets
    WHERE user_id = ${sqlLiteral(userId)};
  `;
  const output = dockerPsqlExec(sql, 'game bet count SQL failed');
  const count = Number(output);
  if (!Number.isInteger(count)) {
    throw new Error('game bet count SQL returned invalid output');
  }
  return count;
}

/**
 * E2E-only wallet fixture: SET available balances via ledger-write guard (bypasses
 * conservation). Use for global-setup and **new** users only. Do not re-SET the shared
 * `readAuth()` user mid-suite — that lowers global Σ and breaks absolute conservation
 * assertions in other specs. Prefer per-test `currencyTotals` snapshots + delta checks.
 */
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
  const output = dockerPsqlExec(sql, 'fund wallet SQL failed');
  if (!output.includes(userId)) {
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
