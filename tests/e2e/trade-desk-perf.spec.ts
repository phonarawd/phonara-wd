/**
 * P3-A — Trade desk perf baseline E2E (Plan trade_desk_qa_audit).
 * Chart FPS · submit INP · latency chain (Submit→Ack→Fill→Wallet) · cold LCP advisory.
 * Operator/CI authoritative (G13 — `bun run test:e2e -- tests/e2e/trade-desk-perf.spec.ts`).
 */
import { test, expect } from '@playwright/test';

import {
  attachTradeConsoleCollector,
  assertTradeConsoleClean,
} from './fixtures/trade-console-collector';
import {
  TRADE_CHART_FPS_MIN,
  TRADE_CHART_FPS_SAMPLE_MS,
  TRADE_COLD_LCP_MAX_MS,
  TRADE_FILL_PANEL_MAX_MS,
  TRADE_LATENCY_CHAIN_SAMPLES,
  TRADE_SUBMIT_ACK_MAX_MS,
  TRADE_SUBMIT_INP_MAX_MS,
  TRADE_WALLET_REFRESH_MAX_MS,
  measureChartFps,
  measureColdTradeLcpMs,
  measureSpotMarketBuyLatencyChain,
  measureSubmitInpMs,
  readAvailBalanceText,
  summarizeLatencyChain,
} from './fixtures/trade-desk-perf';
import {
  clickSpotMarketOrderTab,
  gotoSpotDesk,
  prepareSpotDeskForSubmit,
  prepareTradeDeskSession,
  provisionTradeDeskE2EFixture,
  selectSpotMarket,
  serviceClient,
  setOracleFresh,
  type TradeDeskE2EFixture,
} from './fixtures/trade-desk-money';

test.describe('P3-A trade desk perf baseline', () => {
  let fixture: TradeDeskE2EFixture;

  test.beforeAll(async () => {
    fixture = await provisionTradeDeskE2EFixture();
  });

  test.beforeEach(async ({ page }) => {
    await prepareTradeDeskSession(page, fixture);
  });

  test('P3-A-1 chart tick FPS ≥30 avg (desktop 5s sample · hard)', async ({ page }) => {
    test.setTimeout(120_000);
    const consoleCollector = attachTradeConsoleCollector(page);
    await page.setViewportSize({ width: 1024, height: 900 });

    const admin = serviceClient();
    await setOracleFresh(admin, 'PHON_USDT', '0.100000');
    await gotoSpotDesk(page);
    await expect(page.getByTestId('trade-chart-panel')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('trade-lightweight-chart')).toBeVisible({ timeout: 30_000 });

    const fps = await measureChartFps(page, TRADE_CHART_FPS_SAMPLE_MS);
    expect(
      fps,
      `chart FPS avg must be ≥${TRADE_CHART_FPS_MIN} over ${TRADE_CHART_FPS_SAMPLE_MS}ms`,
    ).toBeGreaterThanOrEqual(TRADE_CHART_FPS_MIN);

    assertTradeConsoleClean(consoleCollector, 'P3-A-1 chart FPS');
  });

  test('P3-A-2 order ticket INP <200ms (submit disabled/loading feedback · hard)', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const consoleCollector = attachTradeConsoleCollector(page);
    await page.setViewportSize({ width: 1024, height: 900 });

    const admin = serviceClient();
    await setOracleFresh(admin, 'PHON_USDT', '0.100000');
    await gotoSpotDesk(page);
    await clickSpotMarketOrderTab(page);
    await page
      .getByTestId('spot-order-ticket')
      .locator('input[inputmode="decimal"]')
      .first()
      .fill('10');
    await prepareSpotDeskForSubmit(page);

    const inpMs = await measureSubmitInpMs(page, 'spot-submit');
    expect(inpMs, `submit INP must be <${TRADE_SUBMIT_INP_MAX_MS}ms`).toBeLessThan(
      TRADE_SUBMIT_INP_MAX_MS,
    );

    assertTradeConsoleClean(consoleCollector, 'P3-A-2 submit INP');
  });

  test('P3-A-3 E2E latency chain Submit→Ack→Fill→Wallet (T1 hard · T2/T3 advisory)', async ({
    page,
  }) => {
    test.setTimeout(300_000);
    const consoleCollector = attachTradeConsoleCollector(page);
    await page.setViewportSize({ width: 1024, height: 900 });

    const admin = serviceClient();
    await setOracleFresh(admin, 'PHON_USDT', '0.100000');
    await gotoSpotDesk(page);
    await selectSpotMarket(page, 'PHON_USDT');
    await clickSpotMarketOrderTab(page);

    const samples = [];
    for (let i = 0; i < TRADE_LATENCY_CHAIN_SAMPLES; i += 1) {
      await gotoSpotDesk(page);
      await clickSpotMarketOrderTab(page);
      await page
        .getByTestId('spot-order-ticket')
        .locator('input[inputmode="decimal"]')
        .first()
        .fill('5');
      await prepareSpotDeskForSubmit(page);
      const availBefore = await readAvailBalanceText(page);
      samples.push(await measureSpotMarketBuyLatencyChain(page, availBefore));
    }

    const summary = summarizeLatencyChain(samples);

    expect(
      summary.t1P95,
      `T1 Submit→Ack p95 must be ≤${TRADE_SUBMIT_ACK_MAX_MS}ms (hard)`,
    ).toBeLessThanOrEqual(TRADE_SUBMIT_ACK_MAX_MS);

    expect(
      summary.t2P95,
      `T2 Ack→Fill row p95 advisory ≤${TRADE_FILL_PANEL_MAX_MS}ms`,
    ).toBeLessThanOrEqual(TRADE_FILL_PANEL_MAX_MS);

    expect(
      summary.t3P95,
      `T3 Fill→Wallet display p95 advisory ≤${TRADE_WALLET_REFRESH_MAX_MS}ms`,
    ).toBeLessThanOrEqual(TRADE_WALLET_REFRESH_MAX_MS);

    await test.info().attach('p3-a-latency-chain-summary.json', {
      body: JSON.stringify({ samples, summary }, null, 2),
      contentType: 'application/json',
    });

    assertTradeConsoleClean(consoleCollector, 'P3-A-3 latency chain');
  });

  test('P3-A-4 cold /trade LCP advisory <2.5s local stack', async ({ page }) => {
    test.setTimeout(120_000);
    const consoleCollector = attachTradeConsoleCollector(page);
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.context().clearCookies();
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });

    await prepareTradeDeskSession(page, fixture);
    const lcpMs = await page
      .goto('/trade', { waitUntil: 'load' })
      .then(() => measureColdTradeLcpMs(page));

    expect(
      lcpMs,
      `cold /trade LCP advisory should be <${TRADE_COLD_LCP_MAX_MS}ms on local stack`,
    ).toBeLessThan(TRADE_COLD_LCP_MAX_MS);

    assertTradeConsoleClean(consoleCollector, 'P3-A-4 cold LCP');
  });
});
