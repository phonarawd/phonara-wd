import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { expect, type Page } from '@playwright/test';
import { spawnSync } from 'node:child_process';

import { ANON_KEY, E2E_USER_PASSWORD, serviceClient, SUPABASE_URL } from './admin-auth';

export { ANON_KEY, E2E_USER_PASSWORD, serviceClient, SUPABASE_URL };

/** Seed storage before first navigation — avoids ads consent sheet body scroll-lock in CI. */
export async function seedWebE2EStorage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem('phonara.ads.analytics_consent', 'denied');
  });
}

export type WalletE2EFixture = {
  userId: string;
  email: string;
  password: string;
  accessToken: string;
  refreshToken: string;
};

export type CurrencyTotals = {
  PHON: string;
  USDT: string;
};

const E2E_CONSENT_DOC_TYPES = [
  'terms_of_service',
  'privacy_policy',
  'risk_disclosure',
  'age_verification',
  'trading_risk_acknowledgement',
] as const;

async function createConfirmedUser(
  admin: SupabaseClient,
  email: string,
  password: string,
): Promise<string> {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw new Error(`createUser failed: ${error?.message ?? 'no user'}`);
  }
  return data.user.id;
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
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error('profile/wallet not created within 15s');
}

async function seedUserConsents(admin: SupabaseClient, userId: string): Promise<void> {
  const { error } = await admin.from('user_consents').insert(
    E2E_CONSENT_DOC_TYPES.map((doc_type) => ({
      user_id: userId,
      doc_type,
      doc_version: 'e2e',
      accepted: true,
    })),
  );
  if (error) throw new Error(`consent insert failed: ${error.message}`);
}

async function signInFixtureUser(email: string, password: string) {
  const pub = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await pub.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(`fixture sign-in failed: ${error?.message ?? 'no session'}`);
  }
  return data.session;
}

export async function provisionWalletE2EFixture(): Promise<WalletE2EFixture> {
  const admin = serviceClient();
  const stamp = Date.now();
  const email = `e2e_wallet_${stamp}@phonara.local`;
  const userId = await createConfirmedUser(admin, email, E2E_USER_PASSWORD);
  await waitForProfileAndWallet(admin, userId);
  await seedUserConsents(admin, userId);

  const session = await signInFixtureUser(email, E2E_USER_PASSWORD);

  return {
    userId,
    email,
    password: E2E_USER_PASSWORD,
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
  };
}

export async function primeWalletMoneyRails(admin: SupabaseClient, userId: string): Promise<void> {
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
      legal_name: 'E2E Wallet User',
      document_type: 'id_card',
      document_last4: 'E2E1',
      country: 'KR',
      idempotency_key: 'e2e-wallet-d3',
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
    source: 'e2e-wallet-d3',
    is_active: true,
    captured_at: new Date().toISOString(),
  });
  await admin
    .from('treasury_reserves')
    .update({ real_balance: '999999999.000000' })
    .in('currency', ['PHON', 'USDT']);

  let reconErr: { message: string } | null = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const { data, error } = await admin.rpc('rpc_run_reconciliation');
    if (!error) {
      const mismatch = Boolean(
        data && typeof data === 'object' && (data as { mismatch?: boolean }).mismatch,
      );
      if (mismatch) {
        // E2E fixtures may use direct wallet funding; restore gates for money-rail specs.
        await admin
          .from('app_config')
          .update({ value: 'false' })
          .in('key', ['system_halt', 'system_readonly']);
      }
      reconErr = null;
      break;
    }
    reconErr = error;
    await new Promise((resolve) => setTimeout(resolve, 750 * attempt));
  }
  if (reconErr) {
    throw new Error(`wallet E2E reconciliation preflight failed: ${reconErr.message}`);
  }
}

export async function waitForKrwDepositFormReady(page: Page): Promise<void> {
  await expect(page.getByTestId('krw-deposit-page')).toBeVisible({ timeout: 20_000 });
  await page
    .waitForResponse(
      (resp) =>
        resp.request().method() === 'GET' &&
        resp.url().includes('/rest/v1/app_config') &&
        resp.status() < 400,
      { timeout: 30_000 },
    )
    .catch(() => undefined);
  await expect(page.getByTestId('krw-deposit-form')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('krw-deposit-paused')).toHaveCount(0, { timeout: 30_000 });
  await expect(page.getByTestId('krw-deposit-amount-input')).toBeEnabled({ timeout: 30_000 });
}

/** Scroll wallet primary CTA above floating BottomNav before click (§34.10 chrome). */
export async function clickWalletPrimaryAction(page: Page, testId: string): Promise<void> {
  const action = page.getByTestId(testId);
  await expect(action).toBeVisible({ timeout: 30_000 });
  await expect(action).toBeEnabled({ timeout: 30_000 });
  await action.evaluate((el) => {
    const clearancePx = 112;
    const rect = el.getBoundingClientRect();
    const targetTop =
      window.scrollY + rect.top - (window.innerHeight - rect.height - clearancePx);
    window.scrollTo({ top: Math.max(0, targetTop), behavior: 'instant' });
  });
  await action.evaluate((el) => {
    (el as HTMLElement).click();
  });
}

export async function waitForKrwWithdrawFormReady(page: Page): Promise<void> {
  await expect(page.getByTestId('krw-withdraw-page')).toBeVisible({ timeout: 20_000 });
  await page
    .waitForResponse(
      (resp) =>
        resp.request().method() === 'GET' &&
        resp.url().includes('/rest/v1/app_config') &&
        resp.status() < 400,
      { timeout: 60_000 },
    )
    .catch(() => undefined);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('krw-withdraw-page')).toBeVisible({ timeout: 20_000 });
  await page
    .waitForResponse(
      (resp) =>
        resp.request().method() === 'GET' &&
        resp.url().includes('/rest/v1/app_config') &&
        resp.status() < 400,
      { timeout: 60_000 },
    )
    .catch(() => undefined);
  await expect(page.getByTestId('krw-withdraw-available')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('krw-withdraw-available')).toContainText(/\d/, { timeout: 30_000 });
  await expect(page.getByTestId('krw-withdraw-amount-input')).toBeEnabled({ timeout: 60_000 });
}

export async function loginWebUser(page: Page, fixture: WalletE2EFixture): Promise<void> {
  await seedWebE2EStorage(page);
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('login-page')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('login-form')).toBeVisible({ timeout: 20_000 });
  // Resolve post-auth destination before submit — avoids /onboarding racing later gotos.
  await page.evaluate((userId) => {
    window.localStorage.setItem(
      'phonara.onboarding.completed.v1',
      JSON.stringify({ [userId]: true }),
    );
  }, fixture.userId);
  await page.getByTestId('login-email').fill(fixture.email);
  await page.getByTestId('login-password').fill(fixture.password);
  await page.getByTestId('login-submit').click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 });
  await page.waitForLoadState('domcontentloaded');
  await page
    .waitForFunction(() => document.readyState === 'complete', { timeout: 10_000 })
    .catch(() => undefined);
}

export async function primeWalletSessionGates(page: Page): Promise<void> {
  await page.goto('/wallet');
  await page.waitForResponse(
    (resp) =>
      resp.request().method() === 'GET' &&
      resp.url().includes('/rest/v1/app_config') &&
      resp.status() < 400,
    { timeout: 60_000 },
  );
  await page
    .waitForResponse(
      (resp) =>
        resp.url().includes('/rest/v1/rpc/rpc_get_compliance_status') && resp.status() < 400,
      { timeout: 60_000 },
    )
    .catch(() => undefined);
}

function sqlLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function dockerPsqlExec(sql: string, errorLabel: string): string {
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
    '-F',
    ',',
  ];
  let lastError = errorLabel;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const result = spawnSync('docker', args, {
      input: sql,
      encoding: 'utf8',
      timeout: 45_000,
    });
    if (result.status === 0 && result.stdout.trim()) {
      return result.stdout.trim();
    }
    lastError = result.stderr || result.stdout || errorLabel;
  }
  throw new Error(lastError);
}

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
  const output = dockerPsqlExec(sql, 'currency totals SQL failed');
  const [usdt, phon] = output.split(',');
  if (!usdt || !phon) throw new Error('currency totals SQL returned no row');
  return { USDT: usdt, PHON: phon };
}

export function setPhonTrackBalances(userId: string, real: string, bonus: string): void {
  const sql = `
    BEGIN;
    SELECT set_config('phonara.ledger_write', 'allowed', true);
    UPDATE public.wallets
       SET phon_real_available = ${sqlLiteral(real)},
           phon_bonus_available = ${sqlLiteral(bonus)},
           phon_real_locked = '0.000000',
           phon_bonus_locked = '0.000000',
           phon_available = (${sqlLiteral(real)}::numeric + ${sqlLiteral(bonus)}::numeric)::text,
           phon_locked = '0.000000'
     WHERE user_id = ${sqlLiteral(userId)}
    RETURNING user_id;
    COMMIT;
  `;
  const output = dockerPsqlExec(sql, 'set phon track balances SQL failed');
  if (!output.includes(userId)) {
    throw new Error('set phon track balances failed: 0 rows updated');
  }
}

export function getPhonRealLocked(userId: string): string {
  const sql = `
    SELECT phon_real_locked
      FROM public.wallets
     WHERE user_id = ${sqlLiteral(userId)};
  `;
  const output = dockerPsqlExec(sql, 'phon real locked query failed');
  if (!output) throw new Error('phon real locked query returned no row');
  return output;
}
