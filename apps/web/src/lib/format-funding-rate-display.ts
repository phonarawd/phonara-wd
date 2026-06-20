import { toDecimal } from '@phonara/money';

export type FundingRateTone = 'neutral' | 'up' | 'down';

/** Server `funding_rates.rate` is a decimal string (e.g. `0` or `0.000100`). */
export function formatFundingRateDisplay(rate: string | null | undefined): {
  display: string;
  tone: FundingRateTone;
} {
  if (rate == null || rate === '') {
    return { display: '0.00%', tone: 'neutral' };
  }
  try {
    const pct = toDecimal(rate).mul(100);
    if (pct.isZero()) {
      return { display: '0.00%', tone: 'neutral' };
    }
    const sign = pct.greaterThan(0) ? '+' : '';
    return {
      display: `${sign}${pct.toFixed(4)}%`,
      tone: pct.greaterThan(0) ? 'up' : 'down',
    };
  } catch {
    return { display: '—', tone: 'neutral' };
  }
}
