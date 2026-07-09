import type { Page } from '@playwright/test';

import {
  TRADE_CHART_FPS_SAMPLE_MS,
  TRADE_WALLET_REFRESH_MAX_MS,
  percentile,
} from '../../../apps/web/src/domain/trade-desk-perf-display-contract';

export {
  TRADE_CHART_FPS_MIN,
  TRADE_CHART_FPS_SAMPLE_MS,
  TRADE_COLD_LCP_MAX_MS,
  TRADE_FILL_PANEL_MAX_MS,
  TRADE_LATENCY_CHAIN_SAMPLES,
  TRADE_SUBMIT_ACK_MAX_MS,
  TRADE_SUBMIT_INP_MAX_MS,
  TRADE_WALLET_REFRESH_MAX_MS,
  percentile,
} from '../../../apps/web/src/domain/trade-desk-perf-display-contract';

export type TradeDeskLatencyChainSample = {
  t1AckMs: number;
  t2FillMs: number;
  t3WalletMs: number;
};

type PerfWindow = {
  __tradeDeskPerf?: {
    t0: number;
    tAck: number;
  };
};

/** Desktop rAF FPS over sample window while chart panel is mounted (Plan P3-A). */
export async function measureChartFps(
  page: Page,
  sampleMs: number = TRADE_CHART_FPS_SAMPLE_MS,
): Promise<number> {
  await page.getByTestId('trade-lightweight-chart').waitFor({ state: 'visible', timeout: 30_000 });
  return page.evaluate(async (durationMs) => {
    let frames = 0;
    const start = performance.now();
    await new Promise<void>((resolve) => {
      const tick = () => {
        frames += 1;
        if (performance.now() - start >= durationMs) {
          resolve();
          return;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    return (frames / durationMs) * 1000;
  }, sampleMs);
}

/** Submit press → disabled or aria-busy feedback (Plan P3-A INP proxy). */
export async function measureSubmitInpMs(page: Page, submitTestId: string): Promise<number> {
  return page.evaluate(async (testId) => {
    const button = document.querySelector(`[data-testid="${testId}"]`) as HTMLButtonElement | null;
    if (!button) throw new Error(`submit button missing: ${testId}`);
    if (button.disabled) throw new Error(`submit button already disabled: ${testId}`);

    const t0 = performance.now();
    button.click();

    while (performance.now() - t0 < 2_000) {
      const busy =
        button.getAttribute('aria-busy') === 'true' ||
        button.disabled ||
        button.querySelector('.animate-spin') != null;
      if (busy) return performance.now() - t0;
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }

    throw new Error(`submit feedback not observed within 2s: ${testId}`);
  }, submitTestId);
}

/** Cold navigation LCP for `/trade` (PerformanceObserver · advisory). */
export async function measureColdTradeLcpMs(page: Page): Promise<number> {
  return page.evaluate(async () => {
    if (typeof PerformanceObserver === 'undefined') {
      const nav = performance.getEntriesByType('navigation')[0] as
        | PerformanceNavigationTiming
        | undefined;
      return nav?.domContentLoadedEventEnd ?? performance.now();
    }

    return new Promise<number>((resolve) => {
      let lcp = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          lcp = Math.max(lcp, entry.startTime);
        }
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });

      const finish = () => {
        observer.disconnect();
        resolve(lcp > 0 ? lcp : performance.now());
      };

      if (document.readyState === 'complete') {
        requestAnimationFrame(finish);
      } else {
        window.addEventListener('load', () => requestAnimationFrame(finish), { once: true });
      }
    });
  });
}

export async function readAvailBalanceText(page: Page): Promise<string> {
  const el = page.getByTestId('spot-ticket-avail-balance');
  await el.waitFor({ state: 'visible', timeout: 20_000 });
  return (await el.innerText()).trim();
}

/**
 * T0 submit click → T1 RPC ack toast · T2 fill row · T3 wallet display (Plan P3-A chain).
 * Caller must prepare desk (oracle fresh · amount filled · submit enabled).
 */
export async function measureSpotMarketBuyLatencyChain(
  page: Page,
  availBefore: string,
  submitTestId = 'spot-submit',
): Promise<TradeDeskLatencyChainSample> {
  await page.evaluate(() => {
    (window as PerfWindow).__tradeDeskPerf = { t0: 0, tAck: 0 };
  });

  const rpcPromise = page.waitForResponse(
    (resp) =>
      resp.url().includes('/rest/v1/rpc/rpc_spot_market_buy') && resp.request().method() === 'POST',
    { timeout: 60_000 },
  );

  await page.evaluate((testId) => {
    const w = window as PerfWindow;
    w.__tradeDeskPerf = { t0: performance.now(), tAck: 0 };
    const button = document.querySelector(`[data-testid="${testId}"]`) as HTMLButtonElement | null;
    if (!button) throw new Error(`submit button missing: ${testId}`);
    button.click();
  }, submitTestId);

  const rpcResponse = await rpcPromise;
  if (rpcResponse.status() >= 400) {
    throw new Error(`spot market buy RPC failed: ${rpcResponse.status()}`);
  }

  await page.locator('[data-sonner-toast]').first().waitFor({ state: 'visible', timeout: 20_000 });

  const t1AckMs = await page.evaluate(() => {
    const w = window as PerfWindow;
    return performance.now() - (w.__tradeDeskPerf?.t0 ?? performance.now());
  });

  await page.evaluate(() => {
    const w = window as PerfWindow;
    if (w.__tradeDeskPerf) w.__tradeDeskPerf.tAck = performance.now();
  });

  await page.getByTestId('trade-desk-dock-tab-history').click();
  const fillsSubtab = page.getByTestId('trade-desk-history-subtab-fills');
  if (await fillsSubtab.isVisible().catch(() => false)) {
    await fillsSubtab.click();
  }

  // Spot market buys settle immediately and do not write spot_order_fills rows.
  // T2 advisory = ack → wallet display refresh on the desk (not fill history panel).
  await page.goto('/trade');
  await page.getByTestId('spot-order-ticket').waitFor({ state: 'visible', timeout: 30_000 });

  await page.waitForFunction(
    ({ before }) => {
      const el = document.querySelector('[data-testid="spot-ticket-avail-balance"]');
      const text = el?.textContent?.trim() ?? '';
      return text.length > 0 && text !== before;
    },
    { before: availBefore },
    { timeout: TRADE_WALLET_REFRESH_MAX_MS + 500 },
  );

  const t2FillMs = await page.evaluate(() => {
    const w = window as PerfWindow;
    return performance.now() - (w.__tradeDeskPerf?.tAck ?? performance.now());
  });

  const t3WalletMs = 0;

  return { t1AckMs, t2FillMs, t3WalletMs };
}

export function summarizeLatencyChain(samples: TradeDeskLatencyChainSample[]): {
  t1P50: number;
  t1P95: number;
  t2P50: number;
  t2P95: number;
  t3P50: number;
  t3P95: number;
} {
  const t1 = samples.map((s) => s.t1AckMs);
  const t2 = samples.map((s) => s.t2FillMs);
  const t3 = samples.map((s) => s.t3WalletMs);
  return {
    t1P50: percentile(t1, 50),
    t1P95: percentile(t1, 95),
    t2P50: percentile(t2, 50),
    t2P95: percentile(t2, 95),
    t3P50: percentile(t3, 50),
    t3P95: percentile(t3, 95),
  };
}
