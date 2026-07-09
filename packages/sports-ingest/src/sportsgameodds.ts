import type { IngestMessage } from '@phonara/sportsbook-engine';
import {
  expandEventWithOdds,
  normalizeVendorEventUpsert,
  type VendorMarketRow,
  type VendorOutcomeRow,
} from './normalizer';
import { SPORTSGAMEODDS_VENDOR } from './vendor-chain';

export { SPORTSGAMEODDS_VENDOR };

const API_HOST = 'https://api.sportsgameodds.com/v2';

/** PHONARA league slug → SportsGameOdds leagueID */
export const LEAGUE_TO_SPORTSGAMEODDS: Readonly<Record<string, string>> = {
  epl: 'EPL',
  nfl: 'NFL',
  nba: 'NBA',
  mlb: 'MLB',
  'world-cup': 'FIFA_WORLD_CUP',
  nhl: 'NHL',
  bundesliga: 'BUNDESLIGA',
  'la-liga': 'LALIGA',
  'serie-a': 'SERIEA',
  'ligue-1': 'LIGUE1',
  mls: 'MLS',
};

export interface FetchSportsGameOddsOptions {
  readonly bookmakerIds?: string;
  readonly eventLimit?: number;
  readonly leagueIdOverride?: string;
}

export interface FetchSportsGameOddsResult {
  readonly messages: readonly IngestMessage[];
  readonly eventCount: number;
}

interface SgoTeamSide {
  readonly names?: { readonly short?: string; readonly long?: string };
}

interface SgoEvent {
  readonly eventID?: string;
  readonly leagueID?: string;
  readonly status?: {
    readonly started?: boolean;
    readonly completed?: boolean;
    readonly cancelled?: boolean;
  };
  readonly teams?: {
    readonly home?: SgoTeamSide;
    readonly away?: SgoTeamSide;
  };
  readonly odds?: Readonly<Record<string, SgoOddEntry>>;
}

interface SgoOddEntry {
  readonly marketName?: string;
  readonly byBookmaker?: Readonly<
    Record<
      string,
      {
        readonly odds?: string | number;
        readonly spread?: string | number;
        readonly overUnder?: string | number;
      }
    >
  >;
}

function resolveSgoLeague(phonaraLeague: string, override?: string): string {
  if (override?.trim()) return override.trim();
  const mapped = LEAGUE_TO_SPORTSGAMEODDS[phonaraLeague];
  if (!mapped) {
    throw new Error(
      `[sportsgameodds] unknown league "${phonaraLeague}" — set SPORTS_SGO_LEAGUE_* override`,
    );
  }
  return mapped;
}

function mapSgoStatus(event: SgoEvent): string {
  if (event.status?.cancelled) return 'cancelled';
  if (event.status?.completed) return 'finished';
  if (event.status?.started) return 'live';
  return 'scheduled';
}

function teamName(side: SgoTeamSide | undefined, fallback: string): string {
  return side?.names?.short ?? side?.names?.long ?? fallback;
}

function pickBookmaker(
  byBookmaker: SgoOddEntry['byBookmaker'],
  preferred?: string,
): { bookmaker: string; line: NonNullable<SgoOddEntry['byBookmaker']>[string] } | undefined {
  if (!byBookmaker) return undefined;
  if (preferred) {
    for (const name of preferred
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)) {
      const exact = byBookmaker[name];
      if (exact) return { bookmaker: name, line: exact };
      const ci = Object.entries(byBookmaker).find(([k]) => k.toLowerCase() === name.toLowerCase());
      if (ci) return { bookmaker: ci[0], line: ci[1] };
    }
  }
  const first = Object.entries(byBookmaker)[0];
  return first ? { bookmaker: first[0], line: first[1] } : undefined;
}

function buildMatch1x2FromSgo(event: SgoEvent, bookmakerId?: string): VendorMarketRow[] {
  const markets: VendorMarketRow[] = [];
  if (!event.odds) return markets;

  for (const odd of Object.values(event.odds)) {
    const name = (odd.marketName ?? '').toLowerCase();
    if (!name.includes('moneyline') && !name.includes('1x2') && !name.includes('match')) continue;

    const picked = pickBookmaker(odd.byBookmaker, bookmakerId);
    if (!picked?.line.odds) continue;

    const raw = picked.line.odds;
    if (typeof raw === 'object') {
      const record = raw as Record<string, unknown>;
      const home = record['home'];
      const draw = record['draw'];
      const away = record['away'];
      const outcomes: VendorOutcomeRow[] = [];
      if (home != null) outcomes.push({ id: 'home', name: 'Home', price: String(home) });
      if (draw != null) outcomes.push({ id: 'draw', name: 'Draw', price: String(draw) });
      if (away != null) outcomes.push({ id: 'away', name: 'Away', price: String(away) });
      if (outcomes.length >= 2) {
        markets.push({ key: 'match_1x2', outcomes });
      }
    }
  }

  return markets;
}

export function mapSportsGameOddsEventToMessages(
  event: SgoEvent,
  leagueCode: string,
  capturedAt: string,
  bookmakerId?: string,
): IngestMessage[] {
  const eventId = event.eventID;
  if (!eventId) return [];

  const vendorMarkets = buildMatch1x2FromSgo(event, bookmakerId);
  if (vendorMarkets.length === 0) return [];

  const upsert = normalizeVendorEventUpsert(
    SPORTSGAMEODDS_VENDOR,
    {
      id: eventId,
      league: { slug: leagueCode },
      home: teamName(event.teams?.home, 'Home'),
      away: teamName(event.teams?.away, 'Away'),
      commenceTime: capturedAt,
      status: mapSgoStatus(event),
    },
    vendorMarkets,
    leagueCode,
  );

  if (upsert.type !== 'event_upsert') return [upsert];

  const prices: Record<string, string | number> = {};
  for (const market of upsert.markets) {
    const sourceMarket = vendorMarkets.find((m) => m.key === market.marketType);
    if (!sourceMarket?.outcomes) continue;
    for (let i = 0; i < market.outcomes.length; i += 1) {
      const outcome = market.outcomes[i];
      const sourceOutcome = sourceMarket.outcomes[i];
      if (outcome && sourceOutcome?.price) {
        prices[outcome.outcomeId] = sourceOutcome.price;
      }
    }
  }

  return expandEventWithOdds(upsert, capturedAt, prices);
}

async function fetchJson<T>(url: URL, apiKey: string): Promise<T> {
  const response = await fetch(url, {
    headers: { 'x-api-key': apiKey, accept: 'application/json' },
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(
      `[sportsgameodds] ${response.status} ${response.statusText}: ${body.slice(0, 200)}`,
    );
  }
  return JSON.parse(body) as T;
}

export async function fetchSportsGameOddsSportOdds(
  apiKey: string,
  leagueSlug: string,
  options: FetchSportsGameOddsOptions = {},
): Promise<FetchSportsGameOddsResult> {
  const leagueID = resolveSgoLeague(leagueSlug, options.leagueIdOverride);
  const bookmakers = options.bookmakerIds ?? 'bet365';
  const limit = options.eventLimit ?? 50;
  const capturedAt = new Date().toISOString();

  const url = new URL('/events', API_HOST);
  url.searchParams.set('apiKey', apiKey);
  url.searchParams.set('leagueID', leagueID);
  url.searchParams.set('oddsAvailable', 'true');
  url.searchParams.set('limit', String(limit));
  if (bookmakers) url.searchParams.set('bookmakerID', bookmakers);

  const payload = await fetchJson<{ data?: SgoEvent[]; events?: SgoEvent[] } | SgoEvent[]>(
    url,
    apiKey,
  );

  const events = Array.isArray(payload) ? payload : (payload.data ?? payload.events ?? []);

  const allMessages: IngestMessage[] = [];
  for (const event of events) {
    allMessages.push(
      ...mapSportsGameOddsEventToMessages(event, leagueSlug, capturedAt, bookmakers.split(',')[0]),
    );
  }

  return { messages: allMessages, eventCount: events.length };
}
