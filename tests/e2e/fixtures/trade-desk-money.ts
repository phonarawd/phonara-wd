import type { SupabaseClient } from '@supabase/supabase-js';
import { expect, type Page } from '@playwright/test';
import { spawnSync } from 'node:child_process';

import {
  currencyTotals,
  loginWebUser,
  primeWalletMoneyRails,
  provisionWalletE2EFixture,
  serviceClient,
  type CurrencyTotals,
  type WalletE2EFixture,
} from './wallet-money';

export type TradeDeskE2EFixture = WalletE2EFixture;

export type TradeDeskViewport = 'mobile' | 'desktop';

export const TRADE_DESK_VIEWPORTS: Record<TradeDeskViewport, { width: number; height: number }> = {
  mobile: { width: 390, height: 844 },
  desktop: { width: 1024, height: 900 },
};

const E2E_TRADE_CONSENT_DOC_TYPES = [
  'terms_of_service',
  'privacy_policy',
  'risk_disclosure',
  'age_verification',
  'trading_risk_acknowledgement',
] as const;

const ORACLE_SYMBOLS = ['PHON_USDT', 'BTC_USDT', 'PHONUSDT-PERP', 'BTCUSDT-SIM'] as const;

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
    if (result.status === 0) {
      return (result.stdout ?? '').trim();
    }
    lastError = result.stderr || result.stdout || errorLabel;
  }
  throw new Error(lastError);
}

async function seedTradeConsents(admin: SupabaseClient, userId: string): Promise<void> {
  const { data: existing, error: readErr } = await admin
    .from('user_consents')
    .select('doc_type')
    .eq('user_id', userId);
  if (readErr) throw new Error(`trade consent read failed: ${readErr.message}`);

  const existingTypes = new Set((existing ?? []).map((row) => row.doc_type));
  const missing = E2E_TRADE_CONSENT_DOC_TYPES.filter((doc_type) => !existingTypes.has(doc_type));
  if (missing.length === 0) return;

  const { error } = await admin.from('user_consents').insert(
    missing.map((doc_type) => ({
      user_id: userId,
      doc_type,
      doc_version: 'e2e-trade',
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

export async function provisionTradeDeskE2EFixture(): Promise<TradeDeskE2EFixture> {
  const fixture = await provisionWalletE2EFixture();
  const admin = serviceClient();
  await primeWalletMoneyRails(admin, fixture.userId);
  await seedTradeConsents(admin, fixture.userId);
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

  fundTradeWalletBalances(fixture.userId, '10000.000000', '5000.000000');

  const { data: reconData, error: reconErr } = await admin.rpc('rpc_run_reconciliation');
  if (reconErr) throw new Error(`trade reconciliation failed: ${reconErr.message}`);
  if (
    reconData &&
    typeof reconData === 'object' &&
    (reconData as { mismatch?: boolean }).mismatch
  ) {
    await admin
      .from('app_config')
      .update({ value: 'false' })
      .in('key', ['system_halt', 'system_readonly']);
  }

  return fixture;
}

const TRADE_DESK_PATH_RE = /\/trade(?:\/|$|\?)/;

const RETRIABLE_TRADE_NAV_RE =
  /NS_BINDING_ABORTED|NS_ERROR_FAILURE|Frame load interrupted|interrupted by another navigation/i;

async function gotoTradeRoute(page: Page, path: '/trade' | '/trade/futures'): Promise<void> {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await page.waitForURL(TRADE_DESK_PATH_RE, { timeout: 15_000 });
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!RETRIABLE_TRADE_NAV_RE.test(message) || attempt === 3) throw error;
      await page.waitForLoadState('domcontentloaded').catch(() => undefined);
    }
  }
}

export async function prepareTradeDeskSession(
  page: Page,
  fixture: TradeDeskE2EFixture,
): Promise<void> {
  const admin = serviceClient();
  await admin
    .from('app_config')
    .update({ value: 'false' })
    .in('key', ['system_halt', 'system_readonly', 'consent_gate_enabled']);
  await admin
    .from('app_config')
    .update({ value: 'true' })
    .in('key', [
      'feature_spot_enabled',
      'feature_futures_enabled',
      'feature_staking_enabled',
      'feature_deposit_enabled',
      'feature_withdrawal_enabled',
    ]);
  await loginWebUser(page, fixture);
  await page.evaluate(
    ({ userId }) => {
      window.localStorage.setItem('phonara.settings.trade.oneClick', '1');
      window.localStorage.setItem('phonara.settings.trade.confirmDialog', '0');
      window.localStorage.setItem('phonara.education.trade.dismissed', '1');
      window.localStorage.setItem(`phonara:trade:house-counterparty-ack:v1:${userId}`, '1');
    },
    { userId: fixture.userId },
  );
  await gotoTradeRoute(page, '/trade');
  await dismissTradeEducationIfVisible(page);
  await page
    .waitForResponse(
      (resp) =>
        resp.request().method() === 'GET' &&
        resp.url().includes('/rest/v1/app_config') &&
        resp.status() < 400,
      { timeout: 60_000 },
    )
    .catch(() => undefined);
  await page
    .getByTestId('spot-desk-page')
    .waitFor({ state: 'visible', timeout: 60_000 })
    .catch(() => undefined);
  await page
    .waitForFunction(() => document.readyState === 'complete', { timeout: 10_000 })
    .catch(() => undefined);
}

export async function dismissTradeEducationIfVisible(page: Page): Promise<void> {
  const sheet = page.getByTestId('trade-first-visit-education-sheet');
  if (await sheet.isVisible().catch(() => false)) {
    await page.getByTestId('trade-education-dismiss').click();
  }
}

/** Limit tab only — excludes Korean "스탑 지정가" (stop-limit). */
export const SPOT_LIMIT_ORDER_TAB = /^지정가$|^Limit$/i;

export async function waitForOraclePricesLoaded(page: Page): Promise<void> {
  await page.waitForResponse(
    (resp) =>
      resp.request().method() === 'GET' &&
      resp.url().includes('/rest/v1/oracle_prices') &&
      resp.status() < 400,
    { timeout: 60_000 },
  );
}

/** P0-4 — allow oracle_prices Realtime pool to reach SUBSCRIBED before disconnect simulation. */
export async function waitForOracleRealtimeSubscribed(page: Page): Promise<void> {
  await waitForOraclePricesLoaded(page);
  await page.waitForTimeout(2_500);
}

export async function openMobileTradePanelIfNeeded(page: Page): Promise<void> {
  const mobileTab = page.getByTestId('trade-desk-mobile-tab-trade');
  if (await mobileTab.isVisible().catch(() => false)) {
    await mobileTab.click();
    await expect(page.getByTestId('trade-desk-mobile-panel-trade')).toBeVisible({
      timeout: 20_000,
    });
    await expandMobileTicketFoldIfNeeded(page);
  }
}

/** DA W3 Fold3 — mobile order ticket starts collapsed; expand before ticket interactions. */
export async function expandMobileTicketFoldIfNeeded(page: Page): Promise<void> {
  const spotTicket = page.getByTestId('spot-order-ticket');
  const futuresTicket = page.getByTestId('futures-order-ticket');
  if (
    (await spotTicket.isVisible().catch(() => false)) ||
    (await futuresTicket.isVisible().catch(() => false))
  ) {
    return;
  }

  const foldToggle = page.getByTestId('trade-mobile-ticket-fold-toggle');
  if (await foldToggle.isVisible().catch(() => false)) {
    await foldToggle.click();
    await expect(page.getByTestId('trade-mobile-ticket-fold-panel')).toBeVisible({
      timeout: 15_000,
    });
  }
}

export async function gotoSpotDesk(page: Page): Promise<void> {
  const pricesLoaded = waitForOraclePricesLoaded(page);
  await gotoTradeRoute(page, '/trade');
  await dismissTradeEducationIfVisible(page);
  await pricesLoaded;
  await expect(page.getByTestId('spot-desk-page')).toBeVisible({ timeout: 30_000 });
}

export async function gotoFuturesDesk(page: Page): Promise<void> {
  const marketsLoaded = page.waitForResponse(
    (resp) =>
      resp.request().method() === 'GET' &&
      resp.url().includes('/rest/v1/futures_markets') &&
      resp.status() < 400,
    { timeout: 60_000 },
  );
  const pricesLoaded = waitForOraclePricesLoaded(page);
  const walletLoaded = page.waitForResponse(
    (resp) =>
      resp.request().method() === 'GET' &&
      resp.url().includes('/rest/v1/wallets') &&
      resp.status() < 400,
    { timeout: 60_000 },
  );
  await gotoTradeRoute(page, '/trade/futures');
  await dismissTradeEducationIfVisible(page);
  await Promise.all([marketsLoaded, pricesLoaded, walletLoaded]);
  await expect(page.getByTestId('futures-desk-page')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('futures-order-ticket')).toBeVisible({ timeout: 30_000 });
}

export async function clickSpotMarketOrderTab(page: Page): Promise<void> {
  await openMobileTradePanelIfNeeded(page);
  const ticket = page.getByTestId('spot-order-ticket');
  await expect(ticket).toBeVisible({ timeout: 30_000 });
  const marketTab = ticket.getByRole('tab', { name: /시장|Market/i });
  if (await marketTab.isVisible().catch(() => false)) {
    await marketTab.click();
  }
}

export async function clickSpotLimitOrderTab(page: Page): Promise<void> {
  await openMobileTradePanelIfNeeded(page);
  await page
    .getByTestId('spot-order-type-tabs')
    .getByRole('tab', { name: SPOT_LIMIT_ORDER_TAB })
    .click();
}

export async function clickFuturesMarketOrderTab(page: Page): Promise<void> {
  await openMobileTradePanelIfNeeded(page);
  const ticket = page.getByTestId('futures-order-ticket');
  await expect(ticket).toBeVisible({ timeout: 30_000 });
  const marketTab = ticket.getByRole('tab', { name: /시장|Market/i });
  if (await marketTab.isVisible().catch(() => false)) {
    await marketTab.click();
  }
}

export async function clickFuturesLimitOrderTab(page: Page): Promise<void> {
  await openMobileTradePanelIfNeeded(page);
  await page
    .getByTestId('futures-order-ticket')
    .getByRole('tab', { name: SPOT_LIMIT_ORDER_TAB })
    .click();
}

/** Side selector only — excludes TradeHelpTip (`롱(오른다) 설명 보기`) and sticky/submit CTAs. */
export async function clickFuturesLongSide(page: Page): Promise<void> {
  await page
    .getByTestId('futures-order-ticket')
    .getByRole('button', { name: /Long \/ Buy|롱 \/ 매수/i })
    .click();
}

export async function prepareSpotDeskForSubmit(
  page: Page,
  viewport: TradeDeskViewport = 'desktop',
): Promise<void> {
  await openMobileTradePanelIfNeeded(page);
  await expect(page.getByTestId('spot-order-ticket')).toBeVisible({ timeout: 30_000 });
  await expect(spotSubmitButton(page, viewport)).toBeEnabled({ timeout: 60_000 });
}

export async function waitForStakingStakeWizard(page: Page): Promise<void> {
  await expect(page.getByTestId('staking-hub-page')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('staking-hub-loading')).toHaveCount(0, { timeout: 60_000 });
  await expect(page.getByTestId('staking-stake-wizard')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('staking-stake-currency-phon')).toBeVisible({ timeout: 30_000 });
}

export async function gotoStakingHub(page: Page): Promise<void> {
  const poolsLoaded = page.waitForResponse(
    (resp) =>
      resp.request().method() === 'GET' &&
      resp.url().includes('/rest/v1/staking_pools') &&
      resp.status() < 400,
    { timeout: 60_000 },
  );
  await page.goto('/staking');
  await poolsLoaded;
  await expect(page.getByTestId('staking-hub-page')).toBeVisible({ timeout: 30_000 });
  await waitForStakingStakeWizard(page);
}

export function spotSubmitButton(page: Page, viewport: TradeDeskViewport) {
  return viewport === 'mobile'
    ? page.getByTestId('spot-mobile-sticky-submit')
    : page.getByTestId('spot-submit');
}

export function futuresSubmitButton(page: Page, viewport: TradeDeskViewport) {
  return viewport === 'mobile'
    ? page.getByTestId('futures-mobile-sticky-submit')
    : page.getByTestId('futures-submit');
}

export async function selectSpotMarket(page: Page, symbol: string): Promise<void> {
  const header = page.getByTestId('spot-market-header');
  await expect(header).toBeVisible({ timeout: 20_000 });
  await header.getByRole('combobox').click();
  await page.getByRole('option', { name: new RegExp(symbol.replace('_', '[/ ]?'), 'i') }).click();
}

/** Canonical futures desk market switch — default desk selection is BTCUSDT-SIM. */
export async function selectFuturesMarket(page: Page, symbol: string): Promise<void> {
  const header = page.getByTestId('futures-market-header');
  await expect(header).toBeVisible({ timeout: 20_000 });
  await header.getByRole('combobox').click();
  const label =
    symbol === 'PHONUSDT-PERP'
      ? /PHON Perpetual|PHONUSDT-PERP/i
      : symbol === 'BTCUSDT-SIM'
        ? /BTC Perpetual|BTCUSDT-SIM/i
        : new RegExp(symbol.replace(/[-_]/g, '[/ -]?'), 'i');
  await page.getByRole('option', { name: label }).click();
}

export async function expectTradeToast(page: Page, pattern: RegExp): Promise<void> {
  await expect(page.getByTestId('trade-toast')).toBeAttached();
  const toast = page.locator('[data-sonner-toast]').filter({ hasText: pattern }).first();
  await expect(toast).toBeVisible({ timeout: 20_000 });
}

export async function setOracleFresh(
  admin: SupabaseClient,
  symbol: string,
  price: string,
): Promise<void> {
  const { error } = await admin
    .from('oracle_prices')
    .upsert({ symbol, price, updated_at: new Date().toISOString() }, { onConflict: 'symbol' });
  if (error) throw new Error(`setOracleFresh failed: ${error.message}`);
}

export async function setOracleStale(
  admin: SupabaseClient,
  symbol: string,
  price: string,
): Promise<void> {
  const staleAt = new Date(Date.now() - 600_000).toISOString();
  const { error } = await admin
    .from('oracle_prices')
    .upsert({ symbol, price, updated_at: staleAt }, { onConflict: 'symbol' });
  if (error) throw new Error(`setOracleStale failed: ${error.message}`);
}

export async function setFuturesKillSwitchOffSpotOn(admin: SupabaseClient): Promise<void> {
  await admin.from('app_config').update({ value: 'false' }).eq('key', 'feature_futures_enabled');
  await admin.from('app_config').update({ value: 'true' }).eq('key', 'feature_spot_enabled');
}

export async function restoreTradeFeatureFlags(admin: SupabaseClient): Promise<void> {
  await admin
    .from('app_config')
    .update({ value: 'true' })
    .in('key', ['feature_spot_enabled', 'feature_futures_enabled', 'feature_staking_enabled']);
}

export function countOpenSpotOrders(userId: string): number {
  const sql = `
    SELECT COUNT(*)::INT
      FROM public.spot_open_orders
     WHERE user_id = ${sqlLiteral(userId)}
       AND status IN ('open', 'pending', 'triggered');
  `;
  const output = dockerPsqlExec(sql, 'count open spot orders failed');
  return Number(output);
}

export function countOpenFuturesPositions(userId: string): number {
  const sql = `
    SELECT COUNT(*)::INT
      FROM public.futures_positions
     WHERE user_id = ${sqlLiteral(userId)}
       AND status = 'open';
  `;
  const output = dockerPsqlExec(sql, 'count futures positions failed');
  return Number(output);
}

export function getWalletUsdtLocked(userId: string): string {
  const sql = `
    SELECT usdt_locked
      FROM public.wallets
     WHERE user_id = ${sqlLiteral(userId)};
  `;
  return dockerPsqlExec(sql, 'wallet usdt locked query failed');
}

export async function runFuturesOrderFills(admin: SupabaseClient): Promise<number> {
  const { data, error } = await admin.rpc('rpc_run_open_order_fills');
  if (error) throw new Error(`rpc_run_open_order_fills failed: ${error.message}`);
  const payload = data as { filled?: number } | null;
  return Number(payload?.filled ?? 0);
}

export function countOpenFuturesOrders(userId: string): number {
  const sql = `
    SELECT COUNT(*)::INT
      FROM public.trading_open_orders
     WHERE user_id = ${sqlLiteral(userId)}
       AND status IN ('open', 'pending', 'triggered', 'partially_filled');
  `;
  const output = dockerPsqlExec(sql, 'count open futures orders failed');
  return Number(output);
}

export function countTradingOrderFills(userId: string): number {
  const sql = `
    SELECT COUNT(*)::INT
      FROM public.trading_order_fills f
      JOIN public.trading_open_orders o ON o.id = f.order_id
     WHERE o.user_id = ${sqlLiteral(userId)};
  `;
  const output = dockerPsqlExec(sql, 'count trading order fills failed');
  return Number(output);
}

export async function fastForwardStakingPosition(
  admin: SupabaseClient,
  positionId: string,
): Promise<void> {
  const { error } = await admin
    .from('staking_positions')
    .update({ staked_at: new Date(Date.now() - 30 * 86_400_000).toISOString() })
    .eq('id', positionId);
  if (error) throw new Error(`fast-forward staking failed: ${error.message}`);
}

export async function getLatestStakingPositionId(
  admin: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data, error } = await admin
    .from('staking_positions')
    .select('id')
    .eq('user_id', userId)
    .order('staked_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`staking position query failed: ${error.message}`);
  return data?.id ?? null;
}

export { currencyTotals, serviceClient, type CurrencyTotals };
