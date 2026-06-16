import { toDecimal } from '@phonara/money';
import type { IngestMessage } from '@phonara/sportsbook-engine';

/** Parse vendor odds into canonical decimal string (never float). */
export function parseOddsDecimal(raw: string | number): string {
  const text = typeof raw === 'number' ? String(raw) : raw.trim();
  const d = toDecimal(text, 'vendor odds');
  if (d.lte(1)) {
    throw new Error('[sports-ingest] odds must be greater than 1');
  }
  return d.toFixed();
}

export function oddsUpsertMessage(
  outcomeId: string,
  odds: string | number,
  capturedAt: string,
): IngestMessage {
  return {
    type: 'odds_upsert',
    outcomeId,
    odds: parseOddsDecimal(odds),
    capturedAt,
  };
}

export function eventRemoveMessage(fixtureId: string, reason: string): IngestMessage {
  return {
    type: 'event_remove',
    fixtureId,
    reason,
  };
}
