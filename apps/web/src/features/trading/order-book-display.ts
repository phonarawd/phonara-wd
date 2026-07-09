import { aggregateLevels, type PriceLevel } from '@phonara/market-display';
import { toDecimal } from '@phonara/money';

import { formatOraclePriceDisplay } from '@/features/trading/format-oracle-price-display';
import type { SyntheticBookLevel } from '@/hooks/use-trading';

export const BOOK_VISIBLE_ROW_LIMIT = 12;

/** Fixed row height for order book slots — prevents CLS when levels update. */
export const BOOK_ROW_SLOT_CLASS = 'h-[1.375rem] shrink-0' as const;

export function padAskBookRows(
  rows: readonly SyntheticBookRow[],
  rowLimit: number = BOOK_VISIBLE_ROW_LIMIT,
): Array<SyntheticBookRow | null> {
  const padCount = Math.max(0, rowLimit - rows.length);
  return [...Array<SyntheticBookRow | null>(padCount).fill(null), ...rows.slice(0, rowLimit)];
}

export function padBidBookRows(
  rows: readonly SyntheticBookRow[],
  rowLimit: number = BOOK_VISIBLE_ROW_LIMIT,
): Array<SyntheticBookRow | null> {
  const visible = rows.slice(0, rowLimit);
  const padCount = Math.max(0, rowLimit - visible.length);
  return [...visible, ...Array<SyntheticBookRow | null>(padCount).fill(null)];
}

export type BookSpreadDisplay = {
  spreadDisplay: string;
  spreadPercentDisplay: string;
};

/** Display-only order book row — prices/sizes from server reference book. */
export type SyntheticBookRow = {
  priceDisplay: string;
  sizeDisplay: string;
  totalDisplay: string;
  cumulativeQty: string;
};

export function mapBookLevels(levels: SyntheticBookLevel[]): SyntheticBookRow[] {
  return levels.map((level) => ({
    priceDisplay: formatOraclePriceDisplay(level.price, level.price),
    sizeDisplay: level.size,
    totalDisplay: level.size,
    cumulativeQty: level.size.replace(/,/g, ''),
  }));
}

export function mapPriceLevels(levels: PriceLevel[]): SyntheticBookRow[] {
  return levels.map(([price, qty]) => ({
    priceDisplay: formatOraclePriceDisplay(price, price),
    sizeDisplay: qty,
    totalDisplay: qty,
    cumulativeQty: qty,
  }));
}

export function parseBookQty(qty: string): ReturnType<typeof toDecimal> {
  const normalized = qty.replace(/,/g, '').trim();
  try {
    const d = toDecimal(normalized);
    return d.greaterThan('0') ? d : toDecimal('0');
  } catch {
    return toDecimal('0');
  }
}

export function maxBookQty(rows: readonly SyntheticBookRow[]): ReturnType<typeof toDecimal> {
  let max = toDecimal('0');
  for (const row of rows) {
    const cum = parseBookQty(row.cumulativeQty);
    if (cum.greaterThan(max)) max = cum;
  }
  return max.greaterThan('0') ? max : toDecimal('1');
}

export function bookDepthWidthPercent(
  cumulativeQty: string,
  maxQty: ReturnType<typeof toDecimal>,
): number {
  const qty = parseBookQty(cumulativeQty);
  if (maxQty.isZero()) return 0;
  return Math.min(100, qty.div(maxQty).mul(100).toNumber());
}

function isSyntheticBookRow(
  level: SyntheticBookLevel | PriceLevel | SyntheticBookRow,
): level is SyntheticBookRow {
  return !Array.isArray(level) && 'priceDisplay' in level;
}

function toPriceLevels(
  levels: readonly (SyntheticBookLevel | PriceLevel | SyntheticBookRow)[],
): PriceLevel[] {
  return levels.map((level): PriceLevel => {
    if (Array.isArray(level)) return [level[0], level[1]];
    if ('price' in level) return [level.price, level.size];
    if (isSyntheticBookRow(level)) {
      return [level.priceDisplay.replace(/,/g, ''), level.sizeDisplay.replace(/,/g, '')];
    }
    return ['0', '0'];
  });
}

export function aggregateBookSide(
  levels: readonly (SyntheticBookLevel | PriceLevel | SyntheticBookRow)[],
  step: string,
): SyntheticBookRow[] {
  const aggregated = aggregateLevels(toPriceLevels(levels), step);
  return aggregated.map(([price, qty]) => ({
    priceDisplay: formatOraclePriceDisplay(price, price),
    sizeDisplay: qty,
    totalDisplay: qty,
    cumulativeQty: qty,
  }));
}

export function applyCumulativeDepth(
  rows: readonly SyntheticBookRow[],
  side: 'ask' | 'bid',
): SyntheticBookRow[] {
  const sorted = [...rows].sort((a, b) => {
    const da = toDecimal(a.priceDisplay.replace(/,/g, ''));
    const db = toDecimal(b.priceDisplay.replace(/,/g, ''));
    return side === 'ask' ? da.comparedTo(db) : db.comparedTo(da);
  });

  let cumulative = toDecimal('0');
  return sorted.map((row) => {
    cumulative = cumulative.plus(parseBookQty(row.sizeDisplay));
    return {
      ...row,
      totalDisplay: cumulative.toFixed(),
      cumulativeQty: cumulative.toFixed(),
    };
  });
}

export function prepareGroupedBook(
  asks: readonly (SyntheticBookLevel | PriceLevel | SyntheticBookRow)[],
  bids: readonly (SyntheticBookLevel | PriceLevel | SyntheticBookRow)[],
  step: string,
): {
  asks: SyntheticBookRow[];
  bids: SyntheticBookRow[];
  maxCumulative: ReturnType<typeof toDecimal>;
} {
  const groupedAsks = applyCumulativeDepth(aggregateBookSide(asks, step), 'ask');
  const groupedBids = applyCumulativeDepth(aggregateBookSide(bids, step), 'bid');
  const maxCumulative = maxBookQty([...groupedAsks, ...groupedBids]);
  return { asks: groupedAsks, bids: groupedBids, maxCumulative };
}

export function sliceVisibleBook(
  asks: readonly SyntheticBookRow[],
  bids: readonly SyntheticBookRow[],
  rowLimit: number = BOOK_VISIBLE_ROW_LIMIT,
): {
  visibleAsks: SyntheticBookRow[];
  visibleBids: SyntheticBookRow[];
  maxSize: ReturnType<typeof toDecimal>;
} {
  const visibleAsks = asks.slice().reverse().slice(0, rowLimit);
  const visibleBids = bids.slice(0, rowLimit);
  const maxSize = maxBookQty([...visibleAsks, ...visibleBids]);
  return { visibleAsks, visibleBids, maxSize };
}

export function resolveBookGroupingSteps(pricePrecision: number): string[] {
  const safePrecision = Math.max(0, Math.min(pricePrecision, 8));
  const minStep = safePrecision === 0 ? '1' : `0.${'0'.repeat(Math.max(0, safePrecision - 1))}1`;
  const steps = [minStep];
  let current = minStep;
  for (let i = 0; i < 4; i += 1) {
    const next = toDecimal(current).mul(10).toFixed();
    steps.push(next);
    current = next;
  }
  return steps;
}

export function parseBookPriceDisplay(priceDisplay: string): ReturnType<typeof toDecimal> {
  return toDecimal(priceDisplay.replace(/,/g, '').trim());
}

export function computeBookSpread(
  asks: readonly SyntheticBookRow[],
  bids: readonly SyntheticBookRow[],
): BookSpreadDisplay | null {
  if (asks.length === 0 || bids.length === 0) return null;

  let bestAsk = parseBookPriceDisplay(asks[0]!.priceDisplay);
  for (const row of asks) {
    const price = parseBookPriceDisplay(row.priceDisplay);
    if (price.lessThan(bestAsk)) bestAsk = price;
  }

  let bestBid = parseBookPriceDisplay(bids[0]!.priceDisplay);
  for (const row of bids) {
    const price = parseBookPriceDisplay(row.priceDisplay);
    if (price.greaterThan(bestBid)) bestBid = price;
  }

  if (bestAsk.lessThanOrEqualTo(bestBid)) return null;

  const spread = bestAsk.minus(bestBid);
  const mid = bestAsk.plus(bestBid).div(2);
  const spreadPercent = mid.isZero() ? toDecimal('0') : spread.div(mid).mul(100);

  return {
    spreadDisplay: formatOraclePriceDisplay(spread.toFixed(), spread.toFixed()),
    spreadPercentDisplay: `${spreadPercent.toFixed(2)}%`,
  };
}

/** Max grouped rows per side for depth chart SVG (display-only · gap #12). */
export const DEPTH_CHART_ROW_LIMIT = 50;

export type DepthChartSidePoint = {
  /** Normalized vertical position — 0 = highest price, 1 = lowest. */
  y: number;
  /** Normalized horizontal depth from center — 0..0.5. */
  depth: number;
};

export type DepthChartModel = {
  bidPoints: DepthChartSidePoint[];
  askPoints: DepthChartSidePoint[];
  bidPath: string;
  askPath: string;
};

function normalizeDepthChartY(
  price: ReturnType<typeof parseBookPriceDisplay>,
  minPrice: ReturnType<typeof parseBookPriceDisplay>,
  maxPrice: ReturnType<typeof parseBookPriceDisplay>,
): number {
  const span = maxPrice.minus(minPrice);
  if (span.isZero()) return 0.5;
  return maxPrice.minus(price).div(span).toNumber();
}

function buildDepthSidePath(points: DepthChartSidePoint[], side: 'bid' | 'ask'): string {
  if (points.length === 0) return '';

  const xAt = (depth: number) => (side === 'bid' ? 50 - depth * 100 : 50 + depth * 100);
  const first = points[0]!;
  const segments = [`M 50 ${first.y * 100}`, `L ${xAt(first.depth)} ${first.y * 100}`];

  for (let index = 1; index < points.length; index += 1) {
    const point = points[index]!;
    const previous = points[index - 1]!;
    segments.push(`L ${xAt(previous.depth)} ${point.y * 100}`);
    segments.push(`L ${xAt(point.depth)} ${point.y * 100}`);
  }

  const last = points[points.length - 1]!;
  segments.push(`L 50 ${last.y * 100}`, 'Z');
  return segments.join(' ');
}

/** Builds mirrored bid/ask depth areas from cumulative book rows (Decimal-safe). */
export function buildDepthChartModel(
  asks: readonly SyntheticBookRow[],
  bids: readonly SyntheticBookRow[],
  rowLimit: number = DEPTH_CHART_ROW_LIMIT,
): DepthChartModel | null {
  if (asks.length === 0 || bids.length === 0) return null;

  const sortedAsks = [...asks]
    .sort((a, b) =>
      parseBookPriceDisplay(a.priceDisplay).comparedTo(parseBookPriceDisplay(b.priceDisplay)),
    )
    .slice(0, rowLimit);
  const sortedBids = [...bids]
    .sort((a, b) =>
      parseBookPriceDisplay(b.priceDisplay).comparedTo(parseBookPriceDisplay(a.priceDisplay)),
    )
    .slice(0, rowLimit);

  const priceDecimals = [...sortedAsks, ...sortedBids].map((row) =>
    parseBookPriceDisplay(row.priceDisplay),
  );
  const minPrice = priceDecimals.reduce((min, price) => (price.lessThan(min) ? price : min));
  const maxPrice = priceDecimals.reduce((max, price) => (price.greaterThan(max) ? price : max));
  if (maxPrice.lessThanOrEqualTo(minPrice)) return null;

  const maxCumulative = maxBookQty([...sortedAsks, ...sortedBids]);
  const toDepth = (cumulativeQty: string) => {
    if (maxCumulative.isZero()) return 0;
    return Math.min(0.5, parseBookQty(cumulativeQty).div(maxCumulative).mul(0.5).toNumber());
  };

  const bidPoints: DepthChartSidePoint[] = sortedBids.map((row) => ({
    y: normalizeDepthChartY(parseBookPriceDisplay(row.priceDisplay), minPrice, maxPrice),
    depth: toDepth(row.cumulativeQty),
  }));
  const askPoints: DepthChartSidePoint[] = sortedAsks.map((row) => ({
    y: normalizeDepthChartY(parseBookPriceDisplay(row.priceDisplay), minPrice, maxPrice),
    depth: toDepth(row.cumulativeQty),
  }));

  return {
    bidPoints,
    askPoints,
    bidPath: buildDepthSidePath(bidPoints, 'bid'),
    askPath: buildDepthSidePath(askPoints, 'ask'),
  };
}
