import { toDecimal } from '@phonara/money';
import { formatOraclePriceDisplay } from '@/features/trading/format-oracle-price-display';

export function formatChange24Display(pct: string): {
  text: string;
  tone: 'up' | 'down' | 'neutral';
} {
  try {
    const d = toDecimal(pct);
    if (d.isZero()) return { text: '—', tone: 'neutral' };
    const sign = d.greaterThanOrEqualTo(0) ? '+' : '';
    return {
      text: `${sign}${d.toFixed(2)}%`,
      tone: d.greaterThan(0) ? 'up' : 'down',
    };
  } catch {
    return { text: '—', tone: 'neutral' };
  }
}

export function formatVolume24Display(volume: string): string {
  try {
    const d = toDecimal(volume);
    if (d.isZero()) return '—';
    if (d.greaterThanOrEqualTo('1000000000')) return `${d.div('1000000000').toFixed(2)}B`;
    if (d.greaterThanOrEqualTo('1000000')) return `${d.div('1000000').toFixed(2)}M`;
    if (d.greaterThanOrEqualTo('1000')) return `${d.div('1000').toFixed(1)}K`;
    return d.toFixed(2);
  } catch {
    return '—';
  }
}

export function formatOpenInterestDisplay(openInterest: string): string {
  return formatVolume24Display(openInterest);
}

export function formatTickerPriceDisplay(price: string): string {
  return formatOraclePriceDisplay(price, '—');
}
