/**
 * Trade chart mount gate — T0-e PR-1B verify contract.
 * Display-only: charts mount when candle count >= 2; settlement uses oracle_prices only.
 *
 * Authority: trade_desk_remediation_v3 · T0-e · PR-1B chart verify
 */

/** Matches TradeChartPanel mount gate and useExchangeLiveCandles MIN_LIVE. */
export const TRADE_CHART_MOUNT_MIN_CANDLES = 2 as const;

/** Matches market_circuit_breakers.staleness_seconds default for trade symbols. */
export const TRADE_ORACLE_STALE_SECONDS = 300 as const;

/** PR-1B spot chart verify symbols (post T0-a~d). */
export const PR1B_SPOT_CHART_VERIFY_SYMBOLS = ['PHON_USDT', 'BTC_USDT'] as const;

export type Pr1bSpotChartVerifySymbol = (typeof PR1B_SPOT_CHART_VERIFY_SYMBOLS)[number];

export type TradeChartFeedStrategy =
  | 'oracle-rpc-only'
  | 'exchange-ws-with-oracle-fallback'
  | 'unsupported';

export type TradeChartPanelMountState = 'loading' | 'empty' | 'mounted';

/** Mirrors trade-chart-panel.tsx loading / empty / chart branches. */
export function resolveTradeChartPanelMount(input: {
  candleCount: number;
  loading: boolean;
}): TradeChartPanelMountState {
  if (input.loading && input.candleCount < TRADE_CHART_MOUNT_MIN_CANDLES) {
    return 'loading';
  }
  if (input.candleCount < TRADE_CHART_MOUNT_MIN_CANDLES) {
    return 'empty';
  }
  return 'mounted';
}

/** PHON skips exchange WS — oracle RPC fallback only (use-display-kline.ts). */
/** UI copy hook: `trade.chart.oracleOnly` on TradeMarketStatusBanner + TradeChartPanel empty state. */
export function resolveTradeChartFeedStrategy(symbol: string | null): TradeChartFeedStrategy {
  if (!symbol) return 'unsupported';
  const upper = symbol.toUpperCase();
  if (upper === 'PHONUSDT-PERP' || upper.startsWith('PHON')) {
    return 'oracle-rpc-only';
  }
  if (upper.endsWith('_USDT') || upper.endsWith('-SIM')) {
    return 'exchange-ws-with-oracle-fallback';
  }
  return 'unsupported';
}

/**
 * ZA-12 — empty-state copy reason (1-G.1/1-G.4): the chart empty state used
 * one generic "waiting for oracle price" copy for every symbol, which mislabels
 * exchange-pair feed outages as if they were the PHON-only oracle-seed-wait
 * case. Differentiates the two so the empty UI names the actual cause instead
 * of a silent/misleading empty.
 */
export type TradeChartEmptyReason = 'oracle-awaiting-seed' | 'feed-unavailable' | 'unsupported';

/** Mirrors TradeChartPanel empty-state branch (candleCount < TRADE_CHART_MOUNT_MIN_CANDLES). */
export function resolveTradeChartEmptyReason(symbol: string | null): TradeChartEmptyReason {
  const strategy = resolveTradeChartFeedStrategy(symbol);
  if (strategy === 'oracle-rpc-only') return 'oracle-awaiting-seed';
  if (strategy === 'exchange-ws-with-oracle-fallback') return 'feed-unavailable';
  return 'unsupported';
}

/** True when oracle mark age exceeds staleness threshold (submit block path). */
export function resolveOraclePriceStale(
  updatedAtMs: number,
  nowMs: number,
  thresholdSeconds: number = TRADE_ORACLE_STALE_SECONDS,
): boolean {
  if (!Number.isFinite(updatedAtMs) || !Number.isFinite(nowMs)) return true;
  const ageSeconds = (nowMs - updatedAtMs) / 1000;
  return ageSeconds > thresholdSeconds;
}

/** PR-1B pass: both verify symbols can mount chart (>= min candles, oracle fresh). */
export function resolvePr1bSpotChartVerifyPass(input: {
  symbolResults: Record<Pr1bSpotChartVerifySymbol, { candleCount: number; oracleStale: boolean }>;
}): boolean {
  return PR1B_SPOT_CHART_VERIFY_SYMBOLS.every((symbol) => {
    const row = input.symbolResults[symbol];
    return row.candleCount >= TRADE_CHART_MOUNT_MIN_CANDLES && row.oracleStale === false;
  });
}
