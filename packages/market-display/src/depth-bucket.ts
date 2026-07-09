import { toDecimal } from '@phonara/money';
import type { PriceLevel } from './order-book-types';

/** Floor price to nearest step bucket (Decimal-safe). */
export function bucketPrice(price: string, step: string): string {
  const p = toDecimal(price);
  const s = toDecimal(step);
  if (s.isZero()) return price;
  return p.div(s).floor().mul(s).toFixed();
}

export function aggregateLevels(levels: PriceLevel[], step: string): PriceLevel[] {
  const map = new Map<string, string>();
  for (const [price, qty] of levels) {
    const key = bucketPrice(price, step);
    const prev = map.get(key) ?? '0';
    map.set(key, toDecimal(prev).plus(toDecimal(qty)).toFixed());
  }
  return [...map.entries()].map(([price, qty]) => [price, qty] as PriceLevel);
}
