import type { MessageKey } from '@phonara/i18n';

/** Flat league rail until `sport_code` is on `rpc_list_sports_fixtures` (SPORTS_UX_CANON). */
export const SPORTS_LEAGUE_FILTER_OPTIONS = ['all', 'epl', 'k_league', 'mlb', 'world_cup'] as const;

export type SportsLeagueFilter = (typeof SPORTS_LEAGUE_FILTER_OPTIONS)[number];

export type SportsPageMode = 'home' | 'prematch' | 'live' | 'my-bets' | 'rules' | 'vip';

export type SportsBoardTab = 'featured' | 'live' | 'today' | 'upcoming';

export const SPORTS_STAKE_CURRENCIES = ['USDT', 'PHON'] as const;

export type SportsStakeCurrency = (typeof SPORTS_STAKE_CURRENCIES)[number];

const LEAGUE_LABEL_KEYS: Record<string, MessageKey> = {
  epl: 'sports.league.epl',
  k_league: 'sports.league.k_league',
  mlb: 'sports.league.mlb',
  world_cup: 'sports.league.world_cup',
};

const LEAGUE_SPORT_CODE: Record<string, string> = {
  epl: 'football',
  k_league: 'football',
  world_cup: 'football',
  mlb: 'baseball',
};

export function leagueFilterToRpcParam(filter: SportsLeagueFilter): string | undefined {
  if (filter === 'all') return undefined;
  return filter;
}

export function resolveSportsLeagueLabelKey(leagueCode: string): MessageKey {
  return LEAGUE_LABEL_KEYS[leagueCode] ?? 'sports.league.unknown';
}

/** Fallback sport bucket until engine exposes `sport_code` on fixture rows. */
export function resolveSportCodeFromLeague(leagueCode: string): string {
  return LEAGUE_SPORT_CODE[leagueCode] ?? 'other';
}

export function resolveSportLabelKey(sportCode: string): MessageKey {
  const key = `sports.sport.${sportCode}` as MessageKey;
  return key;
}

export function resolveSportsPageModeStatusFilter(mode: SportsPageMode): string | undefined {
  if (mode === 'live') return 'live';
  if (mode === 'prematch') return 'scheduled';
  return undefined;
}

export const P10_PAGE_SPORTS_TODO = 'p10-page-sports' as const;
