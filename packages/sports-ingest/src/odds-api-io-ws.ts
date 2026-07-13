import type { IngestMessage } from '@phonara/sportsbook-engine';
import { eventRemoveMessage, oddsUpsertMessage, vendorPriceToOddsString } from './decimal-odds';
import {
  expandEventWithOdds,
  normalizeVendorEventUpsert,
  type VendorMarketRow,
} from './normalizer';
import { ODDS_API_IO_VENDOR } from './vendor-chain';
import type { OddsApiIoMarket } from './odds-api-io';
import { buildMarketsFromIo } from './odds-api-io-shared';
import { canonicalOddsApiIoFixtureId } from './odds-api-io-leagues';

export const ODDS_API_IO_WS_HOST = 'wss://api.odds-api.io/v3/ws';

export interface OddsApiIoWsConnectOptions {
  readonly apiKey: string;
  readonly ioLeagueSlugs: readonly string[];
  readonly markets?: string;
  readonly channels?: string;
  readonly status?: 'live' | 'prematch';
  readonly lastSeq?: number;
}

export interface OddsApiIoWsEventMeta {
  readonly home?: string;
  readonly away?: string;
  readonly date?: string;
  readonly status?: string;
  readonly leagueCode: string;
}

export interface OddsApiIoWsOddsMessage {
  readonly type: string;
  readonly seq?: number;
  readonly id?: string | number;
  readonly bookie?: string;
  readonly markets?: readonly OddsApiIoMarket[];
  readonly timestamp?: number;
  readonly reason?: string;
  readonly last_seq?: number;
  readonly current_seq?: number;
}

export interface OddsApiIoWsScorePayload {
  readonly home?: number;
  readonly away?: number;
  readonly periods?: Readonly<Record<string, { readonly home?: number; readonly away?: number }>>;
}

export interface OddsApiIoWsScoreMessage {
  readonly type: 'score';
  readonly id: string | number;
  readonly scores?: OddsApiIoWsScorePayload;
  readonly timestamp?: number;
}

export interface OddsApiIoWsStatusMessage {
  readonly type: 'status';
  readonly id: string | number;
  readonly status: string;
  readonly scores?: OddsApiIoWsScorePayload;
  readonly timestamp?: number;
}

export interface OddsApiIoFixtureStatusPayload {
  readonly canonicalFixtureId: string;
  readonly status: 'scheduled' | 'live' | 'finished' | 'cancelled';
  readonly homeGoals: number | null;
  readonly awayGoals: number | null;
  readonly reason: string;
  readonly autoSettle: boolean;
}

export function buildOddsApiIoWsUrl(options: OddsApiIoWsConnectOptions): string {
  const params = new URLSearchParams({ apiKey: options.apiKey });
  params.set('markets', options.markets ?? 'ML,Totals');
  params.set('channels', options.channels ?? 'odds,scores,status');
  if (options.ioLeagueSlugs.length > 0) {
    params.set('leagues', options.ioLeagueSlugs.join(','));
  }
  if (options.status) {
    params.set('status', options.status);
  }
  if (options.lastSeq !== undefined && options.lastSeq > 0) {
    params.set('lastSeq', String(options.lastSeq));
  }
  return `${ODDS_API_IO_WS_HOST}?${params.toString()}`;
}

export function parseOddsApiIoWsScores(scores: OddsApiIoWsScorePayload | undefined): {
  homeGoals: number | null;
  awayGoals: number | null;
} {
  if (!scores) return { homeGoals: null, awayGoals: null };

  const ft = scores.periods?.['ft'];
  const home = ft?.home ?? scores.home;
  const away = ft?.away ?? scores.away;

  if (home === undefined || away === undefined) {
    return { homeGoals: null, awayGoals: null };
  }

  return { homeGoals: home, awayGoals: away };
}

export function mapOddsApiIoWsStatusMessage(
  message: OddsApiIoWsStatusMessage,
): OddsApiIoFixtureStatusPayload | null {
  const raw = message.status.toLowerCase();
  const { homeGoals, awayGoals } = parseOddsApiIoWsScores(message.scores);
  const fixtureId = canonicalOddsApiIoFixtureId(message.id);

  if (raw === 'pending') {
    return {
      canonicalFixtureId: fixtureId,
      status: 'scheduled',
      homeGoals,
      awayGoals,
      reason: 'odds-api-io_ws_status_pending',
      autoSettle: false,
    };
  }
  if (raw === 'live') {
    return {
      canonicalFixtureId: fixtureId,
      status: 'live',
      homeGoals,
      awayGoals,
      reason: 'odds-api-io_ws_status_live',
      autoSettle: false,
    };
  }
  if (raw === 'settled') {
    return {
      canonicalFixtureId: fixtureId,
      status: 'finished',
      homeGoals,
      awayGoals,
      reason: 'odds-api-io_ws_status_settled',
      autoSettle: homeGoals !== null && awayGoals !== null,
    };
  }
  if (raw === 'cancelled' || raw === 'canceled') {
    return {
      canonicalFixtureId: fixtureId,
      status: 'cancelled',
      homeGoals,
      awayGoals,
      reason: 'odds-api-io_ws_status_cancelled',
      autoSettle: false,
    };
  }
  return null;
}

export function mapOddsApiIoWsScoreMessage(
  message: OddsApiIoWsScoreMessage,
): OddsApiIoFixtureStatusPayload {
  const { homeGoals, awayGoals } = parseOddsApiIoWsScores(message.scores);
  return {
    canonicalFixtureId: canonicalOddsApiIoFixtureId(message.id),
    status: 'live',
    homeGoals,
    awayGoals,
    reason: 'odds-api-io_ws_score',
    autoSettle: false,
  };
}

function mapMarketsToMessages(
  eventId: string | number,
  ioMarkets: readonly OddsApiIoMarket[],
  leagueCode: string,
  capturedAt: string,
  meta: OddsApiIoWsEventMeta,
): IngestMessage[] {
  const { vendorMarkets } = buildMarketsFromIo(ioMarkets);
  if (vendorMarkets.length === 0) return [];

  const upsert = normalizeVendorEventUpsert(
    ODDS_API_IO_VENDOR,
    {
      id: eventId,
      league: { slug: leagueCode },
      home: meta.home ?? 'Home',
      away: meta.away ?? 'Away',
      commenceTime: meta.date ?? capturedAt,
      status: meta.status ?? 'scheduled',
    },
    vendorMarkets,
    leagueCode,
  );

  if (upsert.type !== 'event_upsert') return [upsert];

  const prices: Record<string, string> = {};
  for (const market of upsert.markets) {
    const sourceMarket = vendorMarkets.find((m) => m.key === market.marketType);
    if (!sourceMarket?.outcomes) continue;
    for (let i = 0; i < market.outcomes.length; i += 1) {
      const outcome = market.outcomes[i];
      const sourceOutcome = sourceMarket.outcomes[i];
      if (!outcome || sourceOutcome?.price === undefined) continue;
      prices[outcome.outcomeId] = vendorPriceToOddsString(sourceOutcome.price);
    }
  }

  return expandEventWithOdds(upsert, capturedAt, prices);
}

/** Map odds-channel WS message (created/updated) to C1 ingest messages. */
export function mapOddsApiIoWsOddsMessage(
  message: OddsApiIoWsOddsMessage,
  meta: OddsApiIoWsEventMeta,
  capturedAt: string,
): IngestMessage[] {
  if (message.type === 'deleted' && message.id !== undefined) {
    return [
      eventRemoveMessage(
        canonicalOddsApiIoFixtureId(message.id),
        message.bookie ? `ws_deleted:${message.bookie}` : 'ws_deleted',
      ),
    ];
  }

  if (
    (message.type === 'created' || message.type === 'updated') &&
    message.id !== undefined &&
    message.markets &&
    message.markets.length > 0
  ) {
    return mapMarketsToMessages(message.id, message.markets, meta.leagueCode, capturedAt, meta);
  }

  if (message.type === 'no_markets' && message.id !== undefined) {
    return [];
  }

  return [];
}

/** Odds-only patch when fixture metadata already exists in PG (outcome ids stable). */
export function mapOddsApiIoWsOddsPatchOnly(
  message: OddsApiIoWsOddsMessage,
  leagueCode: string,
  capturedAt: string,
): IngestMessage[] {
  if (message.type !== 'updated' || message.id === undefined || !message.markets?.length) {
    return [];
  }

  const fixtureId = canonicalOddsApiIoFixtureId(message.id);
  const { vendorMarkets } = buildMarketsFromIo(message.markets);
  const messages: IngestMessage[] = [];

  for (const market of vendorMarkets as VendorMarketRow[]) {
    const marketKey = market.key ?? 'market';
    const marketId = `${fixtureId}:${marketKey}`;
    for (const outcome of market.outcomes ?? []) {
      const outcomeId = `${marketId}:${String(outcome.id ?? outcome.name)}`;
      if (outcome.price === undefined) continue;
      messages.push(
        oddsUpsertMessage(outcomeId, vendorPriceToOddsString(outcome.price), capturedAt),
      );
    }
  }

  void leagueCode;
  return messages;
}

export function extractWsSeq(message: { readonly seq?: number }): number | undefined {
  return typeof message.seq === 'number' && Number.isFinite(message.seq) ? message.seq : undefined;
}

export function isWsResyncRequired(message: OddsApiIoWsOddsMessage): boolean {
  return message.type === 'resync_required';
}
