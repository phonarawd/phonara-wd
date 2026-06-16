import type {
  FixturePayload,
  FixtureStatus,
  IngestMessage,
  MarketPayload,
  OutcomePayload,
  Selection,
} from '@phonara/sportsbook-engine';
import { oddsUpsertMessage, parseOddsDecimal } from './decimal-odds';

export interface VendorEventRow {
  readonly id: string | number;
  readonly league?: { readonly slug?: string; readonly name?: string };
  readonly home?: string;
  readonly away?: string;
  readonly commenceTime?: string;
  readonly status?: string;
}

export interface VendorMarketRow {
  readonly key?: string;
  readonly outcomes?: readonly VendorOutcomeRow[];
}

export interface VendorOutcomeRow {
  readonly id?: string | number;
  readonly name?: string;
  readonly price?: string | number;
  readonly point?: string | number;
}

const STATUS_MAP: Record<string, FixtureStatus> = {
  scheduled: 'scheduled',
  not_started: 'scheduled',
  live: 'live',
  inplay: 'live',
  finished: 'finished',
  completed: 'finished',
  void: 'void',
  cancelled: 'cancelled',
  canceled: 'cancelled',
};

function mapStatus(raw?: string): FixtureStatus {
  if (!raw) return 'scheduled';
  const key = raw.toLowerCase().replace(/\s+/g, '_');
  return STATUS_MAP[key] ?? 'scheduled';
}

function mapSelection(name?: string): Selection {
  const n = (name ?? '').toLowerCase();
  if (n.includes('draw') || n === 'x') return 'draw';
  if (n === 'yes' || n === 'y') return 'yes';
  if (n === 'no' || n === 'n') return 'no';
  if (n.includes('over')) return 'over';
  if (n.includes('under')) return 'under';
  if (n.includes('away')) return 'away';
  return 'home';
}

function canonicalFixtureId(vendor: string, eventId: string | number): string {
  return `${vendor}:${String(eventId)}`;
}

function canonicalMarketId(fixtureId: string, marketKey: string): string {
  return `${fixtureId}:${marketKey}`;
}

function canonicalOutcomeId(marketId: string, outcomeKey: string | number): string {
  return `${marketId}:${String(outcomeKey)}`;
}

export function normalizeVendorEventUpsert(
  vendor: string,
  event: VendorEventRow,
  markets: readonly VendorMarketRow[],
  leagueCodeFallback = 'unknown',
): IngestMessage {
  const fixtureId = canonicalFixtureId(vendor, event.id);
  const fixture: FixturePayload = {
    fixtureId,
    leagueCode: event.league?.slug ?? leagueCodeFallback,
    homeName: event.home ?? 'Home',
    awayName: event.away ?? 'Away',
    kickoffAt: event.commenceTime ?? new Date().toISOString(),
    status: mapStatus(event.status),
  };

  const normalizedMarkets: MarketPayload[] = markets.map((market, index) => {
    const marketKey = market.key ?? `market_${index}`;
    const marketId = canonicalMarketId(fixtureId, marketKey);
    const outcomes: OutcomePayload[] = (market.outcomes ?? []).map((outcome, oIndex) => ({
      outcomeId: canonicalOutcomeId(
        marketId,
        outcome.id ?? outcome.name ?? `outcome_${oIndex}`,
      ),
      selection: mapSelection(outcome.name),
      line: outcome.point !== undefined ? String(outcome.point) : undefined,
    }));

    return {
      marketId,
      marketType: marketKey,
      status: 'open',
      outcomes,
    };
  });

  return {
    type: 'event_upsert',
    fixture,
    markets: normalizedMarkets,
  };
}

/** Flatten event upsert + per-outcome odds upserts for worker persistence batches. */
export function expandEventWithOdds(
  upsert: Extract<IngestMessage, { type: 'event_upsert' }>,
  capturedAt: string,
  prices: Readonly<Record<string, string | number>>,
): IngestMessage[] {
  const messages: IngestMessage[] = [upsert];

  for (const market of upsert.markets) {
    for (const outcome of market.outcomes) {
      const raw = prices[outcome.outcomeId];
      if (raw === undefined) continue;
      messages.push(oddsUpsertMessage(outcome.outcomeId, raw, capturedAt));
    }
  }

  return messages;
}

export function normalizeVendorOddsPatch(
  outcomeId: string,
  rawOdds: string | number,
  capturedAt: string,
): IngestMessage {
  return oddsUpsertMessage(outcomeId, parseOddsDecimal(rawOdds), capturedAt);
}
