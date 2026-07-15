import { toDecimal } from '@phonara/money';
import type { IngestMessage } from '@phonara/sportsbook-engine';

/**
 * Vendor JSON edge only — wire price → text for {@link parseOddsDecimal}.
 * Prefer vendor string fields; `number` is accepted only at JSON parse boundary.
 */
export function vendorPriceToOddsString(raw: string | number): string {
  if (typeof raw === 'string') {
    const text = raw.trim();
    if (!text) {
      throw new Error('[sports-ingest] vendor price string is empty');
    }
    return text;
  }
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    throw new Error('[sports-ingest] vendor price must be a finite number or non-empty string');
  }
  // JSON numbers lack exact decimal text; String() matches prior ingest behavior.
  return String(raw);
}

/** Parse vendor odds into canonical decimal string (never float / never number). */
export function parseOddsDecimal(raw: string): string {
  if (typeof (raw as unknown) !== 'string') {
    throw new Error(
      '[sports-ingest] parseOddsDecimal requires string; use vendorPriceToOddsString at vendor edge',
    );
  }
  const text = raw.trim();
  const d = toDecimal(text, 'vendor odds');
  if (d.lte(1)) {
    throw new Error('[sports-ingest] odds must be greater than 1');
  }
  return d.toFixed();
}

export function oddsUpsertMessage(
  outcomeId: string,
  odds: string,
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
