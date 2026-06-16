import type { IngestMessage } from '@phonara/sportsbook-engine';
import {
  expandEventWithOdds,
  normalizeVendorEventUpsert,
} from './normalizer';
import { ODDS_API_IO_VENDOR } from './vendor-chain';
import { buildMarketsFromIo } from './odds-api-io-shared';

export { ODDS_API_IO_VENDOR };

const API_HOST = 'https://api.odds-api.io/v3';
const MULTI_BATCH_SIZE = 10;

/** PHONARA league slug → Odds-API.io sport + league slug */
export const LEAGUE_TO_ODDS_API_IO: Readonly<
  Record<string, { readonly sport: string; readonly league: string }>
> = {
  epl: { sport: 'football', league: 'england-premier-league' },
  'world-cup': { sport: 'football', league: 'fifa-world-cup' },
  'k-league': { sport: 'football', league: 'south-korea-k-league-1' },
  'la-liga': { sport: 'football', league: 'spain-la-liga' },
  bundesliga: { sport: 'football', league: 'germany-bundesliga' },
  'serie-a': { sport: 'football', league: 'italy-serie-a' },
  'ligue-1': { sport: 'football', league: 'france-ligue-1' },
  mls: { sport: 'football', league: 'usa-mls' },
  'j-league': { sport: 'football', league: 'japan-j-league' },
};

export interface OddsApiIoEvent {
  readonly id: number;
  readonly home: string;
  readonly away: string;
  readonly date: string;
  readonly status: string;
  readonly league?: { readonly slug?: string; readonly name?: string };
}

export interface OddsApiIoMarketOdds {
  readonly home?: string;
  readonly draw?: string;
  readonly away?: string;
  readonly over?: string;
  readonly under?: string;
  readonly max?: number;
  readonly hdp?: number;
}

export interface OddsApiIoMarket {
  readonly name: string;
  readonly odds: readonly OddsApiIoMarketOdds[];
  readonly updatedAt?: string;
}

export interface OddsApiIoEventOdds {
  readonly id: number;
  readonly home: string;
  readonly away: string;
  readonly date: string;
  readonly status: string;
  readonly bookmakers: Readonly<Record<string, readonly OddsApiIoMarket[]>>;
}

export interface FetchOddsApiIoOptions {
  readonly bookmakers?: string;
  readonly eventLimit?: number;
  /** Per-league Odds-API.io slug override (from env SPORTS_ODDS_IO_LEAGUE_*). */
  readonly leagueSlugOverride?: string;
}

export interface FetchOddsApiIoResult {
  readonly messages: readonly IngestMessage[];
  readonly eventCount: number;
  readonly rateLimited: boolean;
}

function resolveIoLeague(
  phonaraLeague: string,
  leagueSlugOverride?: string,
): { sport: string; league: string } {
  if (leagueSlugOverride?.trim()) {
    return { sport: 'football', league: leagueSlugOverride.trim() };
  }

  const mapped = LEAGUE_TO_ODDS_API_IO[phonaraLeague];
  if (!mapped) {
    throw new Error(
      `[odds-api-io] unknown league "${phonaraLeague}" — pass leagueSlugOverride or extend LEAGUE_TO_ODDS_API_IO`,
    );
  }
  return mapped;
}

function mapIoStatus(raw: string): string {
  const key = raw.toLowerCase();
  if (key === 'pending' || key === 'not_started') return 'scheduled';
  if (key === 'live' || key === 'inplay') return 'live';
  if (key === 'settled' || key === 'finished') return 'finished';
  if (key === 'cancelled' || key === 'canceled') return 'cancelled';
  return raw;
}

function pickBookmaker(
  bookmakers: Readonly<Record<string, readonly OddsApiIoMarket[]>>,
  preferred?: string,
): [string, readonly OddsApiIoMarket[]] | undefined {
  if (preferred) {
    const names = preferred.split(',').map((s) => s.trim()).filter(Boolean);
    for (const name of names) {
      const markets = bookmakers[name];
      if (markets && markets.length > 0) return [name, markets];
      const caseInsensitive = Object.entries(bookmakers).find(
        ([key]) => key.toLowerCase() === name.toLowerCase(),
      );
      if (caseInsensitive) return caseInsensitive;
    }
  }
  const first = Object.entries(bookmakers)[0];
  return first ? [first[0], first[1]] : undefined;
}

export function mapOddsApiIoEventOddsToMessages(
  eventOdds: OddsApiIoEventOdds,
  leagueCode: string,
  capturedAt: string,
  bookmakerKey?: string,
): IngestMessage[] {
  const picked = pickBookmaker(eventOdds.bookmakers, bookmakerKey);
  if (!picked) return [];

  const [, ioMarkets] = picked;
  const { vendorMarkets } = buildMarketsFromIo(ioMarkets);
  if (vendorMarkets.length === 0) return [];

  const upsert = normalizeVendorEventUpsert(
    ODDS_API_IO_VENDOR,
    {
      id: eventOdds.id,
      league: { slug: leagueCode },
      home: eventOdds.home,
      away: eventOdds.away,
      commenceTime: eventOdds.date,
      status: mapIoStatus(eventOdds.status),
    },
    vendorMarkets,
    leagueCode,
  );

  if (upsert.type !== 'event_upsert') {
    return [upsert];
  }

  const prices: Record<string, string | number> = {};

  for (const market of upsert.markets) {
    const sourceMarket = vendorMarkets.find((m) => m.key === market.marketType);
    if (!sourceMarket?.outcomes) continue;

    for (let i = 0; i < market.outcomes.length; i += 1) {
      const outcome = market.outcomes[i];
      const sourceOutcome = sourceMarket.outcomes[i];
      if (!outcome || !sourceOutcome?.price) continue;
      prices[outcome.outcomeId] = sourceOutcome.price;
    }
  }

  return expandEventWithOdds(upsert, capturedAt, prices);
}

async function fetchJson<T>(url: URL): Promise<{ data: T; status: number }> {
  const response = await fetch(url);
  const body = await response.text();

  if (!response.ok) {
    if (response.status === 404) {
      return { data: [] as T, status: response.status };
    }
    throw new Error(
      `[odds-api-io] ${response.status} ${response.statusText}: ${body.slice(0, 200)}`,
    );
  }

  return { data: JSON.parse(body) as T, status: response.status };
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

export function isOddsApiIoRateLimitError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('429') || message.toLowerCase().includes('rate limit');
}

export async function fetchOddsApiIoSportOdds(
  apiKey: string,
  leagueSlug: string,
  options: FetchOddsApiIoOptions = {},
): Promise<FetchOddsApiIoResult> {
  const { sport, league } = resolveIoLeague(leagueSlug, options.leagueSlugOverride);
  const bookmakers = options.bookmakers ?? 'Bet365';
  const limit = options.eventLimit ?? 50;
  const capturedAt = new Date().toISOString();

  const eventsUrl = new URL('/events', API_HOST);
  eventsUrl.searchParams.set('apiKey', apiKey);
  eventsUrl.searchParams.set('sport', sport);
  eventsUrl.searchParams.set('league', league);
  eventsUrl.searchParams.set('limit', String(limit));

  let events: OddsApiIoEvent[];
  try {
    const { data, status } = await fetchJson<OddsApiIoEvent[]>(eventsUrl);
    events = data;
    if (status === 404 || events.length === 0) {
      const searchUrl = new URL('/events/search', API_HOST);
      searchUrl.searchParams.set('apiKey', apiKey);
      searchUrl.searchParams.set('query', league);
      searchUrl.searchParams.set('limit', String(limit));
      const searchResult = await fetchJson<OddsApiIoEvent[]>(searchUrl);
      events = searchResult.data;
    }
  } catch (error) {
    if (isOddsApiIoRateLimitError(error)) {
      return { messages: [], eventCount: 0, rateLimited: true };
    }
    throw error;
  }

  const allMessages: IngestMessage[] = [];

  for (const batch of chunk(events, MULTI_BATCH_SIZE)) {
    if (batch.length === 0) continue;

    const multiUrl = new URL('/odds/multi', API_HOST);
    multiUrl.searchParams.set('apiKey', apiKey);
    multiUrl.searchParams.set('eventIds', batch.map((e) => String(e.id)).join(','));
    multiUrl.searchParams.set('bookmakers', bookmakers);

    let oddsBatch: OddsApiIoEventOdds[];
    try {
      const { data } = await fetchJson<OddsApiIoEventOdds[]>(multiUrl);
      oddsBatch = data;
    } catch (error) {
      if (isOddsApiIoRateLimitError(error)) {
        return { messages: allMessages, eventCount: events.length, rateLimited: true };
      }
      throw error;
    }

    for (const eventOdds of oddsBatch) {
      const messages = mapOddsApiIoEventOddsToMessages(
        eventOdds,
        leagueSlug,
        capturedAt,
        bookmakers.split(',')[0],
      );
      allMessages.push(...messages);
    }
  }

  return { messages: allMessages, eventCount: events.length, rateLimited: false };
}
