/**
 * P3-A — Trade desk perf baseline (Plan trade_desk_qa_audit · v5 V2 hard/advisory).
 * Chart FPS + submit INP + E2E latency chain (Submit→Ack→Fill→Wallet) + cold LCP advisory.
 */

export const TRADE_DESK_PERF_TODO = 'p3-perf-benchmark' as const;

export type TradeDeskPerfGateKind = 'hard' | 'advisory';

export type TradeDeskPerfMetricId =
  | 'chart-fps'
  | 'submit-inp'
  | 'latency-t1-ack'
  | 'latency-t2-fill'
  | 'latency-t3-wallet'
  | 'cold-lcp';

export type TradeDeskPerfMetricRow = {
  id: TradeDeskPerfMetricId;
  gate: TradeDeskPerfGateKind;
  /** Minimum (fps) or maximum (ms) threshold depending on comparator. */
  threshold: number;
  unit: 'fps' | 'ms';
  /** One-line Hard/Advisory rationale for perf baseline doc (v5 V2). */
  rationale: string;
};

/** Desktop chart rAF sample window (Plan P3-A). */
export const TRADE_CHART_FPS_SAMPLE_MS = 5_000 as const;

/** Hard — frozen chart = mis-trade risk. */
export const TRADE_CHART_FPS_MIN = 30 as const;

/** Hard — double-click → duplicate order prevention requires immediate feedback. */
export const TRADE_SUBMIT_INP_MAX_MS = 200 as const;

/** Hard T1 — Submit click → RPC ack toast (money path · server authoritative). */
export const TRADE_SUBMIT_ACK_MAX_MS = 800 as const;

/** Advisory T2 — limit fill → fills panel row (P1-A realtime eventual consistency). */
export const TRADE_FILL_PANEL_MAX_MS = 2_000 as const;

/** Supabase query cap for spot/futures fill history (`use-trading` · display-only). */
export const TRADE_FILLS_FETCH_LIMIT = 100 as const;

/** Client-side page size for fills history tables (L-4 · Phase D1). */
export const TRADE_FILLS_PAGE_SIZE = 20 as const;

export function paginateTradeFillsRows<T>(
  rows: readonly T[],
  page: number,
  pageSize: number = TRADE_FILLS_PAGE_SIZE,
): T[] {
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

export function tradeFillsPageCount(
  rowCount: number,
  pageSize: number = TRADE_FILLS_PAGE_SIZE,
): number {
  if (rowCount <= 0) return 1;
  return Math.ceil(rowCount / pageSize);
}

export function clampTradeFillsPage(page: number, totalPages: number): number {
  if (totalPages <= 0) return 1;
  return Math.min(Math.max(1, page), totalPages);
}

/** Advisory T3 — fill → wallet display refresh (`useWallet` invalidate · UI eventual). */
export const TRADE_WALLET_REFRESH_MAX_MS = 3_000 as const;

/** Advisory — cold `/trade` LCP on local stack (not submit critical path). */
export const TRADE_COLD_LCP_MAX_MS = 2_500 as const;

/** E2E latency chain samples for p95 (Plan P3-A). */
export const TRADE_LATENCY_CHAIN_SAMPLES = 5 as const;

export const TRADE_DESK_PERF_E2E_SPEC = 'tests/e2e/trade-desk-perf.spec.ts' as const;

export const TRADE_DESK_PERF_MATRIX: readonly TradeDeskPerfMetricRow[] = [
  {
    id: 'chart-fps',
    gate: 'hard',
    threshold: TRADE_CHART_FPS_MIN,
    unit: 'fps',
    rationale: 'UX trust — frozen chart = mis-trade risk',
  },
  {
    id: 'submit-inp',
    gate: 'hard',
    threshold: TRADE_SUBMIT_INP_MAX_MS,
    unit: 'ms',
    rationale:
      'Double-click duplicate order blocked only after immediate disabled/loading feedback',
  },
  {
    id: 'latency-t1-ack',
    gate: 'hard',
    threshold: TRADE_SUBMIT_ACK_MAX_MS,
    unit: 'ms',
    rationale: 'Money path — server authoritative RPC ack',
  },
  {
    id: 'latency-t2-fill',
    gate: 'advisory',
    threshold: TRADE_FILL_PANEL_MAX_MS,
    unit: 'ms',
    rationale: 'Limit/market fill row — P1-A realtime eventual consistency',
  },
  {
    id: 'latency-t3-wallet',
    gate: 'advisory',
    threshold: TRADE_WALLET_REFRESH_MAX_MS,
    unit: 'ms',
    rationale: 'Wallet display via useWallet invalidate — UI eventual (DB Σ=0 asserted separately)',
  },
  {
    id: 'cold-lcp',
    gate: 'advisory',
    threshold: TRADE_COLD_LCP_MAX_MS,
    unit: 'ms',
    rationale: 'Cold load — trade submit path not blocked by LCP',
  },
] as const;

export function findTradeDeskPerfMetric(
  id: TradeDeskPerfMetricId,
): TradeDeskPerfMetricRow | undefined {
  return TRADE_DESK_PERF_MATRIX.find((row) => row.id === id);
}

/** Linear-interpolation percentile (p ∈ [0, 100]). */
export function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) {
    throw new Error('percentile requires at least one sample');
  }
  if (values.length === 1) return values[0]!;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  if (lower === upper) return sorted[lower]!;
  const weight = rank - lower;
  return sorted[lower]! * (1 - weight) + sorted[upper]! * weight;
}

export function passesMinThreshold(value: number, min: number): boolean {
  return value >= min;
}

export function passesMaxThreshold(value: number, max: number): boolean {
  return value <= max;
}
