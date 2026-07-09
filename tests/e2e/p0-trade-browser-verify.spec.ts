/**
 * P0 browser verification — operator-requested smoke (console · disconnect · 375px sticky).
 * Run: bun run test:e2e -- tests/e2e/p0-trade-browser-verify.spec.ts
 */
import { test, expect } from '@playwright/test';

import {
  attachTradeConsoleCollector,
  assertTradeConsoleClean,
} from './fixtures/trade-console-collector';
import {
  clickFuturesMarketOrderTab,
  clickSpotMarketOrderTab,
  expectTradeToast,
  futuresSubmitButton,
  gotoFuturesDesk,
  gotoSpotDesk,
  gotoStakingHub,
  openMobileTradePanelIfNeeded,
  prepareTradeDeskSession,
  provisionTradeDeskE2EFixture,
  selectSpotMarket,
  serviceClient,
  setOracleFresh,
  waitForOracleRealtimeSubscribed,
  spotSubmitButton,
  type TradeDeskE2EFixture,
} from './fixtures/trade-desk-money';

test.describe('P0 trade browser verification', () => {
  let fixture: TradeDeskE2EFixture;

  test.beforeAll(async () => {
    fixture = await provisionTradeDeskE2EFixture();
  });

  test.beforeEach(async ({ page }) => {
    await prepareTradeDeskSession(page, fixture);
  });

  test('P0-1 staking confirm CTA disabled when balance insufficient', async ({ page }) => {
    const consoleCollector = attachTradeConsoleCollector(page);
    await gotoStakingHub(page);

    await page.getByTestId('staking-stake-currency-phon').click();
    await page.locator('[data-testid^="staking-pool-"]').first().click();
    await page.getByTestId('staking-wizard-next').click();

    await page.getByTestId('staking-amount-input').fill('999999');
    await page.getByTestId('staking-wizard-next').click();

    const confirmCta = page.getByTestId('staking-stake-cta');
    await expect(confirmCta).toBeDisabled({ timeout: 10_000 });
    await expect(page.getByText(/잔액|balance|Insufficient/i).first()).toBeVisible();

    assertTradeConsoleClean(consoleCollector, 'P0-1 staking');
  });

  test('P0-2 claim shows nothing-to-claim toast (not success) on fresh position', async ({
    page,
  }) => {
    const consoleCollector = attachTradeConsoleCollector(page);
    const admin = serviceClient();
    await setOracleFresh(admin, 'PHON_USDT', '0.100000');
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

    const claimButton = page.locator('[data-testid^="staking-claim-"]').first();
    await expect(claimButton).toBeVisible({ timeout: 20_000 });

    const claimRpc = page.waitForResponse(
      (resp) => resp.url().includes('/rest/v1/rpc/rpc_claim_staking_reward'),
      { timeout: 60_000 },
    );
    await claimButton.click();
    await claimRpc;

    await expectTradeToast(page, /아직 받을 보상|No reward to claim/i);
    await expect(
      page.locator('[data-sonner-toast]').filter({ hasText: /보상을 받았|Reward claimed/i }),
    ).toHaveCount(0);

    assertTradeConsoleClean(consoleCollector, 'P0-2 claim');
  });

  test('P0-3 375px sticky CTA disabled styling when insufficient balance', async ({ page }) => {
    const consoleCollector = attachTradeConsoleCollector(page);
    await page.setViewportSize({ width: 375, height: 844 });

    const admin = serviceClient();
    await setOracleFresh(admin, 'BTC_USDT', '68000.000000');
    await gotoSpotDesk(page);
    await selectSpotMarket(page, 'BTC_USDT');
    await openMobileTradePanelIfNeeded(page);
    await clickSpotMarketOrderTab(page);

    await page
      .getByTestId('spot-order-ticket')
      .locator('input[inputmode="decimal"]')
      .first()
      .fill('999999');

    const sticky = page.getByTestId('spot-mobile-sticky-submit');
    await expect(sticky).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('spot-mobile-sticky-submit-reason')).toContainText(
      /잔액|balance/i,
      { timeout: 15_000 },
    );
    await expect(sticky).toBeDisabled({ timeout: 15_000 });
    await expect(sticky).toHaveAttribute('data-disabled-visual', 'true');

    const opacity = await sticky.evaluate((el) => window.getComputedStyle(el).opacity);
    const pointerEvents = await sticky.evaluate((el) => window.getComputedStyle(el).pointerEvents);
    expect(Number(opacity)).toBeLessThanOrEqual(0.5);
    expect(pointerEvents).toBe('none');

    assertTradeConsoleClean(consoleCollector, 'P0-3 sticky styling');
  });

  test('P0 spot mobile + futures submit without console errors', async ({ page }) => {
    test.setTimeout(180_000);
    const consoleCollector = attachTradeConsoleCollector(page);
    const admin = serviceClient();
    await setOracleFresh(admin, 'BTC_USDT', '68000.000000');
    await setOracleFresh(admin, 'BTCUSDT-SIM', '68000.000000');

    await page.setViewportSize({ width: 375, height: 844 });
    await gotoSpotDesk(page);
    await selectSpotMarket(page, 'BTC_USDT');
    await openMobileTradePanelIfNeeded(page);
    await clickSpotMarketOrderTab(page);
    await page
      .getByTestId('spot-order-ticket')
      .locator('input[inputmode="decimal"]')
      .first()
      .fill('25');

    const spotRpc = page.waitForResponse(
      (resp) => resp.url().includes('/rest/v1/rpc/rpc_spot_market_buy'),
      { timeout: 60_000 },
    );
    await spotSubmitButton(page, 'mobile').click();
    await spotRpc;

    await page.setViewportSize({ width: 1024, height: 900 });
    await gotoFuturesDesk(page);
    await clickFuturesMarketOrderTab(page);
    await page
      .getByTestId('futures-order-ticket')
      .locator('input[inputmode="decimal"]')
      .first()
      .fill('50');

    const futuresRpc = page.waitForResponse(
      (resp) => resp.url().includes('/rest/v1/rpc/rpc_open_futures_position'),
      { timeout: 60_000 },
    );
    await futuresSubmitButton(page, 'desktop').click();
    await futuresRpc;

    assertTradeConsoleClean(consoleCollector, 'P0 spot mobile + futures submit');
  });

  test('P0-4 realtime disconnect disables submit with reconnect copy', async ({ page }) => {
    const consoleCollector = attachTradeConsoleCollector(page);
    const admin = serviceClient();
    await setOracleFresh(admin, 'PHON_USDT', '0.100000');

    await page.setViewportSize({ width: 1024, height: 900 });
    await gotoSpotDesk(page);
    await clickSpotMarketOrderTab(page);
    await page
      .getByTestId('spot-order-ticket')
      .locator('input[inputmode="decimal"]')
      .first()
      .fill('10');

    const submit = page.getByTestId('spot-submit');
    await expect(submit).toBeEnabled({ timeout: 60_000 });
    await waitForOracleRealtimeSubscribed(page);

    await page.context().setOffline(true);
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });

    await expect(submit).toBeDisabled({ timeout: 30_000 });
    await expect(page.getByTestId('spot-submit-blocked-reason')).toContainText(
      /실시간 연결|reconnect|Realtime/i,
      { timeout: 30_000 },
    );

    assertTradeConsoleClean(consoleCollector, 'P0-4 disconnect');
  });
});
