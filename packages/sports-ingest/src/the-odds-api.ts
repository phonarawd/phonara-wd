import type { IngestMessage } from '@phonara/sportsbook-engine';
import {
  expandEventWithOdds,
  normalizeVendorEventUpsert,
  type VendorMarketRow,
  type VendorOutcomeRow,
} from './normalizer';

export const THE_ODDS_API_VENDOR = 'the-odds-api';

const API_HOST = 'https://api.the-odds-api.com';

/** PHONARA league slug → The Odds API sport_key */
export const LEAGUE_TO_SPORT_KEY: Readonly<Record<string, string>> = {
  nfl: 'americanfootball_nfl',
  nba: 'basketball_nba',
  mlb: 'baseball_mlb',
  'world-cup': 'soccer_fifa_world_cup',
  epl: 'soccer_epl',
  'k-league': 'soccer_korea_kleague1',
  mls: 'soccer_usa_mls',
  'j-league': 'soccer_japan_j_league',
  'serie-a': 'soccer_italy_serie_a',
  'la-liga': 'soccer_spain_la_liga',
  bundesliga: 'soccer_germany_bundesliga',
  'ligue-1': 'soccer_france_ligue_one',
};

export interface TheOddsApiOutcome {
  readonly name: string;
  readonly price: number;
  readonly point?: number;
}

export interface TheOddsApiMarket {
  readonly key: string;
  readonly outcomes: readonly TheOddsApiOutcome[];
}

export interface TheOddsApiBookmaker {
  readonly key: string;
  readonly title: string;
  readonly last_update: string;
  readonly markets: readonly TheOddsApiMarket[];
}

export interface TheOddsApiEvent {
  readonly id: string;
  readonly sport_key: string;
  readonly commence_time: string;
  readonly home_team: string;
  readonly away_team: string;
  readonly bookmakers: readonly TheOddsApiBookmaker[];
}

export interface FetchSportOddsOptions {
  readonly regions?: string;
  readonly markets?: string;
  readonly bookmakerKey?: string;
  /** Comma-separated The Odds API bookmaker keys (e.g. onexbet,pinnacle). Overrides regions when set. */
  readonly bookmakers?: string;
}

export interface FetchSportOddsResult {
  readonly events: readonly TheOddsApiEvent[];
  readonly requestsRemaining?: string;
  readonly requestsUsed?: string;
}

function resolveSportKey(leagueSlug: string): string {
  return LEAGUE_TO_SPORT_KEY[leagueSlug] ?? leagueSlug;
}

function mapMarketKey(apiKey: string, point?: number): string {
  if (apiKey === 'h2h') return 'match_1x2';
  if (apiKey === 'totals') {
    if (point === 2.5) return 'totals_2_5';
    return point !== undefined ? `totals_${String(point).replace('.', '_')}` : 'totals';
  }
  return apiKey;
}

function mapOutcomeName(
  outcomeName: string,
  homeTeam: string,
  awayTeam: string,
  marketKey: string,
): string {
  const normalized = outcomeName.trim().toLowerCase();
  if (marketKey === 'totals') {
    if (normalized.includes('over')) return 'Over';
    if (normalized.includes('under')) return 'Under';
  }
  if (normalized === 'draw' || normalized === 'tie') return 'Draw';
  if (outcomeName === homeTeam) return 'Home';
  if (outcomeName === awayTeam) return 'Away';
  return outcomeName;
}

function pickBookmaker(
  event: TheOddsApiEvent,
  bookmakerKey?: string,
): TheOddsApiBookmaker | undefined {
  if (bookmakerKey) {
    return event.bookmakers.find((b) => b.key === bookmakerKey) ?? event.bookmakers[0];
  }
  return event.bookmakers[0];
}

export function mapTheOddsApiEventToMessages(
  event: TheOddsApiEvent,
  leagueCode: string,
  capturedAt: string,
  bookmakerKey?: string,
): IngestMessage[] {
  const bookmaker = pickBookmaker(event, bookmakerKey);
  if (!bookmaker) {
    return [];
  }

  const vendorMarkets: VendorMarketRow[] = bookmaker.markets.map((market) => {
    const outcomes: VendorOutcomeRow[] = market.outcomes.map((outcome, index) => ({
      id: `${market.key}:${index}`,
      name: mapOutcomeName(outcome.name, event.home_team, event.away_team, market.key),
      price: outcome.price,
      point: outcome.point,
    }));

    return {
      key: mapMarketKey(market.key, market.outcomes[0]?.point),
      outcomes,
    };
  });

  const upsert = normalizeVendorEventUpsert(
    THE_ODDS_API_VENDOR,
    {
      id: event.id,
      league: { slug: leagueCode },
      home: event.home_team,
      away: event.away_team,
      commenceTime: event.commence_time,
      status: 'scheduled',
    },
    vendorMarkets,
    leagueCode,
  );

  if (upsert.type !== 'event_upsert') {
    return [upsert];
  }

  const prices: Record<string, string | number> = {};
  for (const market of upsert.markets) {
    const sourceMarket = bookmaker.markets.find(
      (m) => mapMarketKey(m.key, m.outcomes[0]?.point) === market.marketType,
    );
    if (!sourceMarket) continue;

    for (let i = 0; i < market.outcomes.length; i += 1) {
      const outcome = market.outcomes[i];
      const sourceOutcome = sourceMarket.outcomes[i];
      if (!outcome || !sourceOutcome) continue;
      prices[outcome.outcomeId] = sourceOutcome.price;
    }
  }

  return expandEventWithOdds(upsert, capturedAt, prices);
}

export async function fetchSportOdds(
  apiKey: string,
  leagueSlug: string,
  options: FetchSportOddsOptions = {},
): Promise<FetchSportOddsResult> {
  const sportKey = resolveSportKey(leagueSlug);
  const regions = options.regions ?? 'uk,eu';
  const markets = options.markets ?? 'h2h,totals';
  const bookmakers = options.bookmakers?.trim();

  const url = new URL(`/v4/sports/${sportKey}/odds`, API_HOST);
  url.searchParams.set('apiKey', apiKey);
  if (bookmakers) {
    url.searchParams.set('bookmakers', bookmakers);
  } else {
    url.searchParams.set('regions', regions);
  }
  url.searchParams.set('markets', markets);
  url.searchParams.set('oddsFormat', 'decimal');

  const response = await fetch(url);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `[the-odds-api] ${response.status} ${response.statusText} for ${sportKey}: ${body.slice(0, 200)}`,
    );
  }

  const events = (await response.json()) as TheOddsApiEvent[];

  return {
    events,
    requestsRemaining: response.headers.get('x-requests-remaining') ?? undefined,
    requestsUsed: response.headers.get('x-requests-used') ?? undefined,
  };
}

export function resolveLeagueSlugForSportKey(sportKey: string): string {
  for (const [slug, key] of Object.entries(LEAGUE_TO_SPORT_KEY)) {
    if (key === sportKey) return slug;
  }
  return sportKey;
}
