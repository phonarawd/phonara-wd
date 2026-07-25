/**
 * Phase 3 — trade-desk-smoke money E2E (spot · futures · staking · toast · Σ=0).
 * Operator/CI authoritative (G13 — run via `bun run test:e2e -- tests/e2e/trade-desk-smoke.spec.ts`).
 */
import { test, expect } from '@playwright/test';

import {
  attachTradeConsoleCollector,
  assertTradeConsoleClean,
  type TradeConsoleCollector,
} from './fixtures/trade-console-collector';
import {
  countOpenFuturesPositions,
  countOpenFuturesOrders,
  countOpenSpotOrders,
  countTradingOrderFills,
  currencyTotals,
  expectTradeToast,
  fastForwardStakingPosition,
  getLatestStakingPositionId,
  getWalletUsdtLocked,
  prepareTradeDeskSession,
  provisionTradeDeskE2EFixture,
  restoreTradeFeatureFlags,
  runFuturesOrderFills,
  selectFuturesMarket,
  selectSpotMarket,
  serviceClient,
  setFuturesKillSwitchOffSpotOn,
  setOracleFresh,
  setOracleStale,
  spotSubmitButton,
  clickFuturesLimitOrderTab,
  clickFuturesLongSide,
  clickFuturesMarketOrderTab,
  clickSpotLimitOrderTab,
  clickSpotMarketOrderTab,
  dismissTradeEducationIfVisible,
  gotoFuturesDesk,
  gotoSpotDesk,
  gotoStakingHub,
  prepareSpotDeskForSubmit,
  TRADE_DESK_VIEWPORTS,
  type TradeDeskE2EFixture,
  waitForOraclePricesLoaded,
} from './fixtures/trade-desk-money';

test.describe('Phase 3 trade-desk-smoke money gate', () => {
  let fixture: TradeDeskE2EFixture;
  let consoleCollector: TradeConsoleCollector | undefined;

  test.beforeAll(async () => {
    fixture = await provisionTradeDeskE2EFixture();
  });

  test.beforeEach(async ({ page }) => {
    await prepareTradeDeskSession(page, fixture);
    consoleCollector = attachTradeConsoleCollector(page);
  });

  test.afterEach(({ page }, testInfo) => {
    void page;
    if (consoleCollector) {
      assertTradeConsoleClean(consoleCollector, testInfo.title);
    }
  });

  test('E1 login → spot chart visible on PHON desk', async ({ page }) => {
    await gotoSpotDesk(page);
    await expect(page.getByTestId('trade-chart-panel')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('spot-market-header')).toBeVisible();
  });

  for (const viewport of ['mobile', 'desktop'] as const) {
    test(`E10 spot buy strict toast (${viewport} ${TRADE_DESK_VIEWPORTS[viewport].width}px)`, async ({
      page,
    }) => {
      test.setTimeout(120_000);
      await page.setViewportSize(TRADE_DESK_VIEWPORTS[viewport]);
      const admin = serviceClient();
      const before = currencyTotals(admin);
      await setOracleFresh(admin, 'BTC_USDT', '68000.000000');

      await gotoSpotDesk(page);
      await selectSpotMarket(page, 'BTC_USDT');
      await clickSpotMarketOrderTab(page);
      const amountInput = page
        .getByTestId('spot-order-ticket')
        .locator('input[inputmode="decimal"]')
        .first();
      await amountInput.fill('50');
      await prepareSpotDeskForSubmit(page, viewport);

      const buyRpc = page.waitForResponse(
        (resp) => resp.url().includes('/rest/v1/rpc/rpc_spot_market_buy'),
        { timeout: 60_000 },
      );
      await spotSubmitButton(page, viewport).click();
      const response = await buyRpc;
      expect(response.status(), 'spot market buy RPC should succeed').toBeLessThan(400);

      await expectTradeToast(page, /매수 완료|Bought/i);

      const after = currencyTotals(admin);
      expect(after.USDT, 'spot buy must conserve USDT Σ').toBe(before.USDT);
      expect(after.PHON, 'spot buy must conserve PHON Σ').toBe(before.PHON);
    });
  }

  test('E11 spot amount Enter triggers submit path (keyboard-only)', async ({ page }) => {
    test.setTimeout(120_000);
    const admin = serviceClient();
    const before = currencyTotals(admin);
    await setOracleFresh(admin, 'BTC_USDT', '68000.000000');

    await gotoSpotDesk(page);
    await selectSpotMarket(page, 'BTC_USDT');
    await clickSpotMarketOrderTab(page);
    const amountInput = page.getByTestId('spot-amount-input');
    await amountInput.fill('50');
    await prepareSpotDeskForSubmit(page, 'desktop');

    const buyRpc = page.waitForResponse(
      (resp) => resp.url().includes('/rest/v1/rpc/rpc_spot_market_buy'),
      { timeout: 60_000 },
    );
    await amountInput.press('Enter');
    const response = await buyRpc;
    expect(response.status(), 'keyboard Enter spot buy RPC should succeed').toBeLessThan(400);

    await expectTradeToast(page, /매수 완료|Bought/i);

    const after = currencyTotals(admin);
    expect(after.USDT, 'keyboard spot buy must conserve USDT Σ').toBe(before.USDT);
    expect(after.PHON, 'keyboard spot buy must conserve PHON Σ').toBe(before.PHON);
  });

  test('E2 spot market buy on BTC preserves global conservation Σ=0', async ({ page }) => {
    test.setTimeout(120_000);
    const admin = serviceClient();
    const before = currencyTotals(admin);
    await setOracleFresh(admin, 'BTC_USDT', '68000.000000');

    await gotoSpotDesk(page);
    await selectSpotMarket(page, 'BTC_USDT');
    await clickSpotMarketOrderTab(page);
    await page
      .getByTestId('spot-order-ticket')
      .locator('input[inputmode="decimal"]')
      .first()
      .fill('25');
    await prepareSpotDeskForSubmit(page);

    const buyRpc = page.waitForResponse(
      (resp) => resp.url().includes('/rest/v1/rpc/rpc_spot_market_buy'),
      { timeout: 60_000 },
    );
    await page.getByTestId('spot-submit').click();
    await buyRpc;

    const after = currencyTotals(admin);
    expect(after.USDT).toBe(before.USDT);
    expect(after.PHON).toBe(before.PHON);
  });

  test('E3 spot limit place + cancel restores lock (no orphan)', async ({ page }) => {
    test.setTimeout(120_000);
    const admin = serviceClient();
    await setOracleFresh(admin, 'PHON_USDT', '0.100000');

    await gotoSpotDesk(page);
    await expect(page.getByTestId('spot-order-ticket')).toBeVisible({ timeout: 30_000 });

    await clickSpotLimitOrderTab(page);
    await page.getByTestId('spot-limit-price-input').fill('0.090000');
    await page
      .getByTestId('spot-order-ticket')
      .locator('input[inputmode="decimal"]')
      .first()
      .fill('10');
    await prepareSpotDeskForSubmit(page);

    const placeRpc = page.waitForResponse(
      (resp) => resp.url().includes('/rest/v1/rpc/rpc_place_spot_limit_order'),
      { timeout: 60_000 },
    );
    await page.getByTestId('spot-submit').click();
    await placeRpc;

    expect(countOpenSpotOrders(fixture.userId)).toBeGreaterThan(0);
    expect(getWalletUsdtLocked(fixture.userId)).not.toBe('0.000000');

    await page.getByTestId('trade-desk-dock-tab-open-orders').click();
    const cancelButton = page.locator('[data-testid^="open-order-cancel-"]').first();
    await expect(cancelButton).toBeVisible({ timeout: 20_000 });

    const cancelRpc = page.waitForResponse(
      (resp) => resp.url().includes('/rest/v1/rpc/rpc_cancel_spot_order'),
      { timeout: 60_000 },
    );
    await cancelButton.click();
    await cancelRpc;

    expect(countOpenSpotOrders(fixture.userId)).toBe(0);
    expect(getWalletUsdtLocked(fixture.userId)).toBe('0.000000');
  });

  test('E4 futures market open + close leaves position 0 and Σ=0', async ({ page }) => {
    test.setTimeout(180_000);
    const admin = serviceClient();
    const before = currencyTotals(admin);
    await setOracleFresh(admin, 'PHONUSDT-PERP', '0.100000');

    await gotoFuturesDesk(page);
    await clickFuturesMarketOrderTab(page);
    await page
      .getByTestId('futures-order-ticket')
      .locator('input[inputmode="decimal"]')
      .first()
      .fill('50');
    await expect(page.getByTestId('futures-submit')).toBeEnabled({ timeout: 60_000 });

    const openRpc = page.waitForResponse(
      (resp) => resp.url().includes('/rest/v1/rpc/rpc_open_futures_position'),
      { timeout: 60_000 },
    );
    await page.getByTestId('futures-submit').click();
    await openRpc;

    expect(countOpenFuturesPositions(fixture.userId)).toBe(1);

    await page.getByTestId('trade-desk-dock-tab-positions').click();
    const closeButton = page.locator('[data-testid^="futures-close-position-"]').first();
    await expect(closeButton).toBeVisible({ timeout: 20_000 });

    const closeRpc = page.waitForResponse(
      (resp) => resp.url().includes('/rest/v1/rpc/rpc_close_futures_position'),
      { timeout: 60_000 },
    );
    await closeButton.click();
    await page
      .getByRole('button', { name: /확인 후 진행|Confirm & proceed/i })
      .click({ timeout: 15_000 });
    await closeRpc;

    expect(countOpenFuturesPositions(fixture.userId)).toBe(0);

    const after = currencyTotals(admin);
    expect(after.USDT).toBe(before.USDT);
    expect(after.PHON).toBe(before.PHON);
  });

  test('E5 futures limit order fill via cron path', async ({ page }) => {
    test.setTimeout(180_000);
    const admin = serviceClient();
    await setOracleFresh(admin, 'PHONUSDT-PERP', '0.100000');

    await gotoFuturesDesk(page);
    await selectFuturesMarket(page, 'PHONUSDT-PERP');
    await clickFuturesLimitOrderTab(page);
    await clickFuturesLongSide(page);
    await page.getByTestId('futures-limit-price-input').fill('0.095000');
    await page.getByTestId('futures-margin-input').fill('20');
    await expect(page.getByTestId('futures-submit')).toBeEnabled({ timeout: 60_000 });

    const placeRpc = page.waitForResponse(
      (resp) => resp.url().includes('/rest/v1/rpc/rpc_place_limit_order'),
      { timeout: 60_000 },
    );
    await page.getByTestId('futures-submit').click();
    const placeResponse = await placeRpc;
    expect(placeResponse.status(), 'limit order RPC should succeed').toBeLessThan(400);
    expect(countOpenFuturesOrders(fixture.userId)).toBeGreaterThan(0);

    // Long limit at 0.095 fills when mark <= limit (_order_limit_crossed).
    await setOracleFresh(admin, 'PHONUSDT-PERP', '0.094000');
    let filled = await runFuturesOrderFills(admin);
    if (filled < 1) {
      filled = await runFuturesOrderFills(admin);
    }
    expect(filled, 'cron fill runner should produce at least one fill').toBeGreaterThanOrEqual(1);
    expect(countTradingOrderFills(fixture.userId)).toBeGreaterThan(0);

    const fillsLoaded = page.waitForResponse(
      (resp) =>
        resp.request().method() === 'GET' &&
        resp.url().includes('/rest/v1/trading_order_fills') &&
        resp.status() < 400,
      { timeout: 60_000 },
    );
    await page.reload();
    await expect(page.getByTestId('futures-desk-page')).toBeVisible({ timeout: 30_000 });
    await fillsLoaded.catch(() => undefined);
    await page.getByTestId('trade-desk-dock-tab-history').click();
    await page.getByTestId('trade-desk-history-subtab-fills').click();
    await expect(page.getByTestId('trade-fills-history-panel')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-testid="trade-fill-row"]').first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('E6 stake PHON + claim preserves Σ=0', async ({ page }) => {
    test.setTimeout(180_000);
    const admin = serviceClient();
    const before = currencyTotals(admin);

    await gotoStakingHub(page);

    await page.getByTestId('staking-stake-currency-phon').click();
    const phonPool = page.locator('[data-testid^="staking-pool-"]').first();
    await expect(phonPool).toBeVisible({ timeout: 20_000 });
    await phonPool.click();
    await page.getByTestId('staking-wizard-next').click();

    await page.getByTestId('staking-amount-input').fill('100');
    await page.getByTestId('staking-wizard-next').click();

    const stakeRpc = page.waitForResponse(
      (resp) =>
        resp.url().includes('/rest/v1/rpc/rpc_stake_phon') ||
        resp.url().includes('/rest/v1/rpc/rpc_stake'),
      { timeout: 60_000 },
    );
    await page.getByTestId('staking-stake-cta').click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /진행|Proceed/i })
      .click();
    await stakeRpc;

    const positionId = await getLatestStakingPositionId(admin, fixture.userId);
    expect(positionId).toBeTruthy();
    if (positionId) {
      await fastForwardStakingPosition(admin, positionId);
      await page.reload();
      await expect(page.getByTestId('staking-hub-page')).toBeVisible({ timeout: 30_000 });
      const claimButton = page.locator(`[data-testid="staking-claim-${positionId}"]`);
      if (await claimButton.isVisible().catch(() => false)) {
        const claimRpc = page.waitForResponse(
          (resp) => resp.url().includes('/rest/v1/rpc/rpc_claim_staking_reward'),
          { timeout: 60_000 },
        );
        await claimButton.click();
        await claimRpc;
      }
    }

    const after = currencyTotals(admin);
    expect(after.PHON).toBe(before.PHON);
    expect(after.USDT).toBe(before.USDT);
  });

  test('E7 stake major USDT pool (BTC) preserves Σ=0', async ({ page }) => {
    test.setTimeout(180_000);
    const admin = serviceClient();
    const before = currencyTotals(admin);

    await gotoStakingHub(page);

    await page.getByTestId('staking-reference-BTC').click();
    await page.getByTestId('staking-stake-currency-usdt').click();
    const btcPool = page.locator('[data-testid^="staking-pool-"]').first();
    await btcPool.click();
    await page.getByTestId('staking-wizard-next').click();

    await page.getByTestId('staking-amount-input').fill('200');
    await page.getByTestId('staking-wizard-next').click();

    const stakeRpc = page.waitForResponse((resp) => resp.url().includes('/rest/v1/rpc/rpc_stake'), {
      timeout: 60_000,
    });
    await page.getByTestId('staking-stake-cta').click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /진행|Proceed/i })
      .click();
    await stakeRpc;

    const after = currencyTotals(admin);
    expect(after.USDT).toBe(before.USDT);
    expect(after.PHON).toBe(before.PHON);
  });

  test('E8 stale oracle blocks submit while chart panel stays visible', async ({ page }) => {
    const admin = serviceClient();
    await setOracleStale(admin, 'PHON_USDT', '0.100000');

    // beforeEach already lands on /trade — reload so oracle_prices refetch picks up stale updated_at.
    const pricesLoaded = waitForOraclePricesLoaded(page);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await dismissTradeEducationIfVisible(page);
    await pricesLoaded;
    await expect(page.getByTestId('spot-desk-page')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('trade-chart-panel')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('spot-submit')).toBeDisabled({ timeout: 20_000 });
    await expect(page.getByTestId('spot-submit-blocked-reason')).toBeVisible();

    await setOracleFresh(admin, 'PHON_USDT', '0.100000');
  });

  test('E9 futures kill-switch OFF leaves spot submit enabled', async ({ page }) => {
    const admin = serviceClient();
    await setFuturesKillSwitchOffSpotOn(admin);
    await setOracleFresh(admin, 'PHON_USDT', '0.100000');

    await gotoSpotDesk(page);
    await prepareSpotDeskForSubmit(page);

    await gotoFuturesDesk(page);
    await expect(page.getByTestId('futures-submit')).toBeDisabled({ timeout: 20_000 });

    await restoreTradeFeatureFlags(admin);
  });

  test('E11 futures open shows toast with positions CTA', async ({ page }) => {
    test.setTimeout(120_000);
    const admin = serviceClient();
    await setOracleFresh(admin, 'PHONUSDT-PERP', '0.100000');

    await gotoFuturesDesk(page);
    await page
      .getByTestId('futures-order-ticket')
      .locator('input[inputmode="decimal"]')
      .first()
      .fill('30');
    await expect(page.getByTestId('futures-submit')).toBeEnabled({ timeout: 60_000 });

    const openRpc = page.waitForResponse(
      (resp) => resp.url().includes('/rest/v1/rpc/rpc_open_futures_position'),
      { timeout: 60_000 },
    );
    await page.getByTestId('futures-submit').click();
    await openRpc;

    await expectTradeToast(page, /개설|opened/i);
    const cta = page
      .locator('[data-sonner-toast]')
      .getByRole('button', { name: /포지션|Positions/i });
    await expect(cta.first()).toBeVisible({ timeout: 10_000 });
  });

  test('E12 stale RPC returns error toast when confirm races stale oracle', async ({ page }) => {
    test.setTimeout(120_000);
    const admin = serviceClient();

    await page.evaluate(() => {
      window.localStorage.setItem('phonara.settings.trade.oneClick', '0');
      window.localStorage.setItem('phonara.settings.trade.confirmDialog', '1');
    });

    await setOracleFresh(admin, 'PHON_USDT', '0.100000');
    await gotoSpotDesk(page);
    await page
      .getByTestId('spot-order-ticket')
      .locator('input[inputmode="decimal"]')
      .first()
      .fill('10');
    await prepareSpotDeskForSubmit(page);
    await page.getByTestId('spot-submit').click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });

    await setOracleStale(admin, 'PHON_USDT', '0.100000');
    await page.waitForTimeout(2_000);

    const staleRpc = page.waitForResponse(
      (resp) => resp.url().includes('/rest/v1/rpc/rpc_spot_market_buy'),
      { timeout: 60_000 },
    );
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /매수|Buy/i })
      .click();
    const response = await staleRpc;
    expect(response.status()).toBeGreaterThanOrEqual(400);

    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('spot-submit')).toBeDisabled({ timeout: 15_000 });
    await setOracleFresh(admin, 'PHON_USDT', '0.100000');
  });

  test('E13 tier RPC failure disables claim with no ledger movement', async ({ page }) => {
    test.setTimeout(180_000);
    const admin = serviceClient();
    const before = currencyTotals(admin);

    await gotoStakingHub(page);

    await page.getByTestId('staking-stake-currency-phon').click();
    await page.locator('[data-testid^="staking-pool-"]').first().click();
    await page.getByTestId('staking-wizard-next').click();
    await page.getByTestId('staking-amount-input').fill('50');
    await page.getByTestId('staking-wizard-next').click();

    const stakeRpc = page.waitForResponse(
      (resp) =>
        resp.url().includes('/rest/v1/rpc/rpc_stake') ||
        resp.url().includes('/rest/v1/rpc/rpc_stake_phon'),
      { timeout: 60_000 },
    );
    await page.getByTestId('staking-stake-cta').click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /진행|Proceed/i })
      .click();
    await stakeRpc;

    const positionId = await getLatestStakingPositionId(admin, fixture.userId);
    expect(positionId).toBeTruthy();

    let claimRpcCount = 0;
    page.on('response', (resp) => {
      if (resp.url().includes('/rest/v1/rpc/rpc_claim_staking_reward')) {
        claimRpcCount += 1;
      }
    });

    await page.route('**/rest/v1/rpc/rpc_get_earn_hub_status', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'tier unavailable',
          code: 'PGRST000',
        }),
      });
    });

    await page.reload();
    await expect(page.getByTestId('staking-hub-page')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('staking-tier-error')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('staking-tier-badge')).toHaveCount(0);

    const claimButton = page.locator(`[data-testid="staking-claim-${positionId}"]`);
    await expect(claimButton).toBeVisible({ timeout: 20_000 });
    await expect(claimButton).toBeDisabled({ timeout: 10_000 });

    await claimButton.click({ force: true, timeout: 5_000 }).catch(() => undefined);
    await page.waitForTimeout(1_000);
    expect(claimRpcCount, 'tier-blind claim RPC must not fire').toBe(0);

    const after = currencyTotals(admin);
    expect(after.PHON, 'tier error claim attempt must conserve PHON Σ').toBe(before.PHON);
    expect(after.USDT, 'tier error claim attempt must conserve USDT Σ').toBe(before.USDT);
  });
});
