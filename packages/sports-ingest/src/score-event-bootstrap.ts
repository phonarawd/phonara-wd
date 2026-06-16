import type { IngestMessage } from '@phonara/sportsbook-engine';
import {
  canonicalFixtureIdFromVendorEvent,
  type TheOddsApiScoreEvent,
} from './the-odds-api-scores';

/** Bootstrap fixture row from scores feed when odds ingest never upserted the event. */
export function scoreEventToFixtureBootstrapMessage(
  event: TheOddsApiScoreEvent,
  leagueCode: string,
): IngestMessage {
  return {
    type: 'event_upsert',
    fixture: {
      fixtureId: canonicalFixtureIdFromVendorEvent(event.id),
      leagueCode,
      homeName: event.home_team,
      awayName: event.away_team,
      kickoffAt: event.commence_time,
      status: event.completed ? 'finished' : 'live',
    },
    markets: [],
  };
}
