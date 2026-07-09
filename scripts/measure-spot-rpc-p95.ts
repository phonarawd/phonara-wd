/**
 * Isolated PostgREST latency probe for spot trading RPCs (ENGINE 100 · G7).
 * Run against a local `supabase start` stack — NOT during check:full or E2E.
 *
 *   bun run scripts/measure-spot-rpc-p95.ts
 *   bun run scripts/measure-spot-rpc-p95.ts --samples=40
 */
import { createClient } from '@supabase/supabase-js';
import { spawnSyncSafe } from './lib/spawn-safe';

const SUPABASE_URL = process.env['VITE_SUPABASE_URL'] ?? 'http://127.0.0.1:54321';
const ANON_KEY =
  process.env['VITE_SUPABASE_ANON_KEY'] ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

function readLocalServiceKey(): string {
  const result = spawnSyncSafe('supabase', ['status', '-o', 'env'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error('Local Supabase not running. Start with `supabase start`.');
  }
  const values = new Map<string, string>();
  for (const line of result.stdout.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=['"]?(.+?)['"]?$/);
    if (match) values.set(match[1]!, match[2]!);
  }
  const key =
    values.get('SECRET_KEY') ??
    values.get('SUPABASE_SERVICE_ROLE_KEY') ??
    values.get('SERVICE_ROLE_KEY');
  if (!key) throw new Error('Could not read local service role key from `supabase status`.');
  return key.replace(/^['"]|['"]$/g, '');
}

function findSupabaseDbContainer(): string {
  const probe = spawnSyncSafe('docker', ['ps', '--format', '{{.Names}}'], { encoding: 'utf8' });
  const name = probe.stdout
    ?.split(/\r?\n/)
    .map((s) => s.trim())
    .find((n) => n.startsWith('supabase_db_'));
  if (!name) throw new Error('No supabase_db_* container found. Run `supabase start`.');
  return name;
}

function runDockerPsql(sql: string): void {
  const container = findSupabaseDbContainer();
  const exec = spawnSyncSafe(
    'docker',
    [
      'exec',
      '-i',
      container,
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
  if (exec.status !== 0) throw new Error(`psql failed: ${exec.stderr ?? exec.stdout}`);
}

function fundWallet(userId: string): void {
  runDockerPsql(`
    BEGIN;
    SELECT set_config('phonara.ledger_write', 'allowed', true);
    UPDATE public.wallets
       SET phon_available = '1000000.000000', usdt_available = '1000000.000000'
     WHERE user_id = '${userId}'
    RETURNING user_id;
    COMMIT;
  `);
}

function setSpotRateLimitsActive(active: boolean): void {
  runDockerPsql(`
    UPDATE rpc_rate_limit_configs
       SET is_active = ${active ? 'true' : 'false'}
     WHERE rpc_name IN ('rpc_spot_market_buy', 'rpc_spot_market_sell');
  `);
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))]!;
}

async function waitForProfileAndWallet(
  admin: ReturnType<typeof createClient>,
  userId: string,
): Promise<void> {
  for (let attempt = 0; attempt < 75; attempt += 1) {
    const [{ data: profile }, { data: wallet }] = await Promise.all([
      admin.from('profiles').select('id').eq('id', userId).maybeSingle(),
      admin.from('wallets').select('user_id').eq('user_id', userId).maybeSingle(),
    ]);
    if (profile && wallet) return;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('profile/wallet not created by handle_new_user trigger');
}

async function main(): Promise<void> {
  const sampleArg = process.argv.find((a) => a.startsWith('--samples='));
  const samples = sampleArg ? Number(sampleArg.split('=')[1]) : 40;
  if (!Number.isFinite(samples) || samples < 30) {
    throw new Error('--samples must be >= 30');
  }

  const serviceKey = readLocalServiceKey();
  const admin = createClient(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const email = `perf_${Date.now()}@phonara.local`;
  const password = 'Perf-Test-Password-123456';

  const { data: created, error: cErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (cErr || !created.user) throw new Error(`createUser failed: ${cErr?.message ?? 'no user'}`);
  const userId = created.user.id;
  await waitForProfileAndWallet(admin, userId);
  fundWallet(userId);

  setSpotRateLimitsActive(false);
  try {
    await admin.from('app_config').update({ value: 'false' }).eq('key', 'consent_gate_enabled');
    await admin.from('app_config').update({ value: 'false' }).eq('key', 'system_halt');
    await admin.from('app_config').update({ value: 'true' }).eq('key', 'feature_spot_enabled');
    await admin.from('spot_markets').update({ is_active: true }).eq('symbol', 'PHON_USDT');
    await admin
      .from('oracle_prices')
      .upsert(
        { symbol: 'PHON_USDT', price: '0.010000', updated_at: new Date().toISOString() },
        { onConflict: 'symbol' },
      );

    const pub = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
    const { data: signIn, error: sErr } = await pub.auth.signInWithPassword({ email, password });
    if (sErr || !signIn.session)
      throw new Error(`sign-in failed: ${sErr?.message ?? 'no session'}`);

    const client = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${signIn.session.access_token}` } },
    });

    const buyMs: number[] = [];
    const sellMs: number[] = [];

    for (let i = 0; i < samples; i += 1) {
      const buyStart = performance.now();
      const { error: buyErr } = await client.rpc('rpc_spot_market_buy', {
        p_usdt_spent: '10.000000',
        p_client_request_id: `perf-buy-${userId}-${i}`,
      });
      buyMs.push(performance.now() - buyStart);
      if (buyErr) throw new Error(`rpc_spot_market_buy[${i}]: ${buyErr.message}`);

      const sellStart = performance.now();
      const { error: sellErr } = await client.rpc('rpc_spot_market_sell', {
        p_phon_sold: '500.000000',
        p_client_request_id: `perf-sell-${userId}-${i}`,
      });
      sellMs.push(performance.now() - sellStart);
      if (sellErr) throw new Error(`rpc_spot_market_sell[${i}]: ${sellErr.message}`);
    }

    const summarize = (label: string, values: number[]) => {
      const sorted = [...values].sort((a, b) => a - b);
      return {
        rpc: label,
        n: sorted.length,
        p50_ms: Math.round(percentile(sorted, 50)),
        p95_ms: Math.round(percentile(sorted, 95)),
        p99_ms: Math.round(percentile(sorted, 99)),
        min_ms: Math.round(sorted[0] ?? 0),
        max_ms: Math.round(sorted[sorted.length - 1] ?? 0),
      };
    };

    const result = {
      measured_at: new Date().toISOString(),
      environment: 'local',
      supabase_url: SUPABASE_URL,
      samples,
      rate_limits_disabled_for_probe: true,
      buy: summarize('rpc_spot_market_buy', buyMs),
      sell: summarize('rpc_spot_market_sell', sellMs),
    };

    console.log(JSON.stringify(result, null, 2));
  } finally {
    setSpotRateLimitsActive(true);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
