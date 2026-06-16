/** Registered market types (mirrors sports_market_type_registry). */
export const SPORTS_MARKET_TYPES = [
  'match_1x2',
  'totals_2_5',
  'totals',
  'spread',
  'handicap',
  'asian_handicap',
  'btts',
  'both_teams_score',
  'prop_over_under',
  'prop_yes_no',
] as const;

export type RegisteredMarketType = (typeof SPORTS_MARKET_TYPES)[number];

export type SportsBetKind = 'single' | 'combo' | 'sgp' | 'system';

export function parseTotalsLine(marketType: string, marketLine?: string): string | undefined {
  if (marketLine?.trim()) return marketLine.trim();
  if (marketType === 'totals_2_5') return '2.5';
  const match = /^totals_(\d+)_(\d+)$/.exec(marketType);
  if (match) return `${match[1]}.${match[2]}`;
  return undefined;
}
