import { toDecimal } from '@phonara/money';

const FALLBACK = '—';

/** Display-only oracle price string with thousands grouping; no float math. */
export function formatOraclePriceDisplay(price: string | undefined, fallback = FALLBACK): string {
  if (!price || price === '0') return fallback;
  try {
    const d = toDecimal(price);
    const dp = d.greaterThanOrEqualTo(1000) ? 1 : d.greaterThanOrEqualTo(1) ? 2 : 4;
    const fixed = d.toDecimalPlaces(dp).toFixed(dp);
    const [intPart = '0', fracPart] = fixed.split('.');
    const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return fracPart ? `${grouped}.${fracPart}` : grouped;
  } catch {
    return fallback;
  }
}

export type PriceDir = 'up' | 'down' | 'flat';

export function comparePriceDir(next: string, prev: string | null): PriceDir {
  if (!prev) return 'flat';
  try {
    const cmp = toDecimal(next).comparedTo(toDecimal(prev));
    if (cmp > 0) return 'up';
    if (cmp < 0) return 'down';
    return 'flat';
  } catch {
    return 'flat';
  }
}
