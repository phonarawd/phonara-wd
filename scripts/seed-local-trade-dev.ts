#!/usr/bin/env tsx
/**
 * Idempotent local Trade desk dev account (Docker Supabase only).
 * Mirrors E2E trade-desk fixture: consents · KYC · oracle · funded wallet.
 * Writes `.local-trade-dev.credentials.json` (gitignored).
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { readLocalSupabaseEnv } from './lib/db-connect';
import { ensureDockerReady } from './lib/docker-ready';
import { ensureLocalSupabaseStarted } from './lib/supabase-local';

const CREDENTIALS_FILE = join(process.cwd(), '.local-trade-dev.credentials.json');

export const DEV_TRADE_EMAIL = 'dev-trade@phonara.local';
export const DEV_TRADE_PASSWORD = 'Phonara-Trade-Dev-123456';

const TRADE_CONSENT_DOC_TYPES = [
  'terms_of_service',
  'privacy_policy',
  'risk_disclosure',
  'age_verification',
  'trading_risk_acknowledgement',
] as const;

const ORACLE_SYMBOLS = ['PHON_USDT', 'BTC_USDT', 'PHONUSDT-PERP', 'BTCUSDT-SIM'] as const;

export interface LocalTradeCredentials {
  email: string;
  password: string;
  userId: string;
  loginUrl: string;
  spotDeskUrl: string;
  futuresDeskUrl: string;
  supabaseUrl: string;
  usdtAvailable: string;
  phonAvailable: string;
  createdAt: string;
}

function assertLocalUrl(url: string): void {
  if (!url.includes('127.0.0.1') && !url.includes('localhost')) {
    throw new Error('seed:local-trade refuses non-local Supabase URL');
  }
}

function sqlLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function dockerPsqlExec(sql: string, errorLabel: string): string {
  const container =
    spawnSync('docker', ['ps', '--format', '{{.Names}}'], { encoding: 'utf8' })
      .stdout?.split(/\r?\n/)
      .map((s) => s.trim())
      .find((name) => name.startsWith('supabase_db_')) ?? 'supabase_db_yocjhjsdwoijfdrehzoq';

  const result = spawnSync(
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
    { input: sql, encoding: 'utf8', timeout: 45_000 },
  );
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || errorLabel);
  }
  return (result.stdout ?? '').trim();
}

async function waitForProfileAndWallet(admin: SupabaseClient, userId: string): Promise<void> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    const { data: wallet } = await admin
      .from('wallets')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (profile && wallet) return;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('profile/wallet not created by handle_new_user trigger within 15s');
}

async function findUserIdByEmail(admin: SupabaseClient, email: string): Promise<string | null> {
  let page = 1;
  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit.id;
    if (data.users.length < 200) break;
    page += 1;
  }
  return null;
}

async function primeWalletMoneyRails(admin: SupabaseClient, userId: string): Promise<void> {
  await admin
    .from('profiles')
    .update({
      kyc_tier: 'id_verified',
      created_at: new Date(Date.now() - 7 * 86_400_000).toISOString(),
    })
    .eq('id', userId);
  await admin.from('sanctions_screenings').upsert({
    user_id: userId,
    status: 'clear',
    screened_at: new Date().toISOString(),
  });
  const { error: kycErr } = await admin.from('kyc_submissions').upsert(
    {
      user_id: userId,
      status: 'approved',
      legal_name: 'Local Trade Dev User',
      document_type: 'id_card',
      document_last4: 'TRD1',
      country: 'KR',
      idempotency_key: 'local-trade-dev',
      reviewed_at: new Date(Date.now() - 48 * 3_600_000).toISOString(),
    },
    { onConflict: 'user_id,idempotency_key' },
  );
  if (kycErr) throw new Error(`kyc submission seed failed: ${kycErr.message}`);

  await admin
    .from('app_config')
    .update({ value: 'false' })
    .in('key', ['system_halt', 'system_readonly']);
  await admin.from('app_config').update({ value: 'true' }).eq('key', 'feature_deposit_enabled');
  await admin.from('app_config').update({ value: 'true' }).eq('key', 'feature_withdrawal_enabled');
  await admin
    .from('app_config')
    .update({ value: 'false' })
    .eq('key', 'withdrawal_mfa_step_up_enabled');
  await admin
    .from('app_config')
    .update({ value: '0' })
    .in('key', [
      'aml_min_account_age_hours',
      'aml_rapid_credit_hours',
      'aml_kyc_approval_cooldown_hours',
    ]);
  await admin
    .from('exchange_rate_snapshots')
    .update({ is_active: false })
    .eq('base_currency', 'PHON')
    .eq('quote_currency', 'KRW');
  await admin.from('exchange_rate_snapshots').insert({
    base_currency: 'PHON',
    quote_currency: 'KRW',
    rate: '10.000000',
    source: 'local-trade-dev',
    is_active: true,
    captured_at: new Date().toISOString(),
  });
  await admin
    .from('treasury_reserves')
    .update({ real_balance: '999999999.000000' })
    .in('currency', ['PHON', 'USDT']);
}

async function seedTradeConsents(admin: SupabaseClient, userId: string): Promise<void> {
  const { data: existing, error: readErr } = await admin
    .from('user_consents')
    .select('doc_type')
    .eq('user_id', userId);
  if (readErr) throw new Error(`trade consent read failed: ${readErr.message}`);

  const existingTypes = new Set((existing ?? []).map((row) => row.doc_type));
  const missing = TRADE_CONSENT_DOC_TYPES.filter((doc_type) => !existingTypes.has(doc_type));
  if (missing.length === 0) return;

  const { error } = await admin.from('user_consents').insert(
    missing.map((doc_type) => ({
      user_id: userId,
      doc_type,
      doc_version: 'local-trade-dev',
      accepted: true,
    })),
  );
  if (error) throw new Error(`trade consent insert failed: ${error.message}`);
}

async function seedFreshOraclePrices(admin: SupabaseClient): Promise<void> {
  const now = new Date().toISOString();
  const rows = [
    { symbol: 'PHON_USDT', price: '0.100000' },
    { symbol: 'BTC_USDT', price: '68000.000000' },
    { symbol: 'PHONUSDT-PERP', price: '0.100000' },
    { symbol: 'BTCUSDT-SIM', price: '68000.000000' },
  ];
  for (const row of rows) {
    const { error } = await admin
      .from('oracle_prices')
      .upsert({ symbol: row.symbol, price: row.price, updated_at: now }, { onConflict: 'symbol' });
    if (error) throw new Error(`oracle upsert ${row.symbol} failed: ${error.message}`);
  }
}

async function activateTradeMarkets(admin: SupabaseClient): Promise<void> {
  await admin
    .from('spot_markets')
    .update({ is_active: true })
    .in('symbol', ['PHON_USDT', 'BTC_USDT']);
  await admin
    .from('futures_markets')
    .update({ is_active: true, max_leverage: 20, max_user_positions: 100 })
    .in('symbol', ['PHONUSDT-PERP', 'BTCUSDT-SIM']);
  await admin
    .from('market_circuit_breakers')
    .update({ is_halted: false, staleness_seconds: 300 })
    .in('symbol', [...ORACLE_SYMBOLS]);
}

function fundTradeWalletBalances(userId: string, usdt: string, phon: string): void {
  const sql = `
    BEGIN;
    SELECT set_config('phonara.ledger_write', 'allowed', true);
    UPDATE public.wallets
       SET usdt_available = ${sqlLiteral(usdt)},
           usdt_locked = '0.000000',
           phon_available = ${sqlLiteral(phon)},
           phon_locked = '0.000000',
           phon_real_available = ${sqlLiteral(phon)},
           phon_bonus_available = '0.000000',
           phon_real_locked = '0.000000',
           phon_bonus_locked = '0.000000'
     WHERE user_id = ${sqlLiteral(userId)}
    RETURNING user_id;
    COMMIT;
  `;
  const output = dockerPsqlExec(sql, 'fund trade wallet balances failed');
  if (!output.includes(userId)) {
    throw new Error('fund trade wallet balances failed: 0 rows updated');
  }
}

async function provisionTradeDevUser(
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<LocalTradeCredentials> {
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let userId = await findUserIdByEmail(admin, DEV_TRADE_EMAIL);
  if (!userId) {
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email: DEV_TRADE_EMAIL,
      password: DEV_TRADE_PASSWORD,
      email_confirm: true,
    });
    if (cErr || !created.user) {
      throw new Error(`createUser failed: ${cErr?.message ?? 'no user'}`);
    }
    userId = created.user.id;
  } else {
    const { error: pwErr } = await admin.auth.admin.updateUserById(userId, {
      password: DEV_TRADE_PASSWORD,
    });
    if (pwErr) throw new Error(`updateUser password failed: ${pwErr.message}`);
  }

  await waitForProfileAndWallet(admin, userId);
  await primeWalletMoneyRails(admin, userId);
  await seedTradeConsents(admin, userId);
  await activateTradeMarkets(admin);
  await seedFreshOraclePrices(admin);
  await admin.from('staking_pools').update({ is_active: true });

  await admin
    .from('app_config')
    .update({ value: 'false' })
    .in('key', ['system_halt', 'system_readonly', 'consent_gate_enabled']);
  await admin
    .from('app_config')
    .update({ value: 'true' })
    .in('key', ['feature_spot_enabled', 'feature_futures_enabled', 'feature_staking_enabled']);

  const usdtAvailable = '10000.000000';
  const phonAvailable = '5000.000000';
  fundTradeWalletBalances(userId, usdtAvailable, phonAvailable);

  const { error: reconErr } = await admin.rpc('rpc_run_reconciliation');
  if (reconErr) throw new Error(`trade reconciliation failed: ${reconErr.message}`);

  // Dev seed updates wallet balances without ledger legs (trade UI shortcut).
  // Reconciliation detects the mismatch and sets system_readonly — restore for local earn/onboarding.
  await admin
    .from('app_config')
    .update({ value: 'false' })
    .in('key', ['system_halt', 'system_readonly']);

  return {
    email: DEV_TRADE_EMAIL,
    password: DEV_TRADE_PASSWORD,
    userId,
    loginUrl: 'http://127.0.0.1:3000/login',
    spotDeskUrl: 'http://127.0.0.1:3000/trade/spot',
    futuresDeskUrl: 'http://127.0.0.1:3000/trade/futures',
    supabaseUrl,
    usdtAvailable,
    phonAvailable,
    createdAt: new Date().toISOString(),
  };
}

function printBanner(creds: LocalTradeCredentials): void {
  process.stdout.write('\n=== PHONARA Trade desk · local dev ===\n');
  process.stdout.write(`Login:    ${creds.loginUrl}\n`);
  process.stdout.write(`Spot:     ${creds.spotDeskUrl}\n`);
  process.stdout.write(`Futures:  ${creds.futuresDeskUrl}\n`);
  process.stdout.write(`Email:    ${creds.email}\n`);
  process.stdout.write(`Password: ${creds.password}\n`);
  process.stdout.write(`User ID:  ${creds.userId}\n`);
  process.stdout.write(`Balance:  USDT ${creds.usdtAvailable} · PHON ${creds.phonAvailable}\n`);
  process.stdout.write(`Supabase: ${creds.supabaseUrl}\n`);
  process.stdout.write(`Saved:    ${CREDENTIALS_FILE}\n`);
  process.stdout.write('\nFlow: bun run dev:web:local → login → /trade/spot\n\n');
}

async function main(): Promise<void> {
  ensureDockerReady({ quiet: false, startDesktop: false });
  ensureLocalSupabaseStarted({ quiet: false });

  const localEnv = readLocalSupabaseEnv();
  if (!localEnv?.VITE_SUPABASE_URL || !localEnv.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Local Supabase env unavailable — run `supabase db reset` then retry');
  }

  assertLocalUrl(localEnv.VITE_SUPABASE_URL);

  process.stdout.write('[seed:local-trade] provisioning trade-ready dev user…\n');
  const creds = await provisionTradeDevUser(
    localEnv.VITE_SUPABASE_URL,
    localEnv.SUPABASE_SERVICE_ROLE_KEY,
  );

  writeFileSync(CREDENTIALS_FILE, JSON.stringify(creds, null, 2));
  printBanner(creds);
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
