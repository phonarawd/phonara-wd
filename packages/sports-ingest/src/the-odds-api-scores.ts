import type { TheOddsApiEvent } from './the-odds-api';
import { LEAGUE_TO_SPORT_KEY, THE_ODDS_API_VENDOR } from './the-odds-api';

const API_HOST = 'https://api.the-odds-api.com';

export type TheOddsApiScoreEntry =
  | string
  | null
  | {
      readonly name?: string;
      readonly score?: string | null;
    };

export interface TheOddsApiScoreEvent {
  readonly id: string;
  readonly sport_key: string;
  readonly commence_time: string;
  readonly completed: boolean;
  readonly home_team: string;
  readonly away_team: string;
  readonly scores?: readonly TheOddsApiScoreEntry[] | null;
  readonly last_update?: string;
}

export interface FetchSportScoresResult {
  readonly events: readonly TheOddsApiScoreEvent[];
  readonly requestsRemaining?: string;
}

export function canonicalFixtureIdFromVendorEvent(eventId: string): string {
  return `${THE_ODDS_API_VENDOR}:${eventId}`;
}

function parseScoreEntryValue(entry: TheOddsApiScoreEntry): number | null {
  if (entry === null || entry === undefined) return null;
  if (typeof entry === 'string') {
    if (entry === '') return null;
    const parsed = Number.parseInt(entry, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  const raw = entry.score;
  if (raw === null || raw === undefined || raw === '') return null;
  const parsed = Number.parseInt(String(raw), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseScoreGoals(scores: readonly TheOddsApiScoreEntry[] | null | undefined): {
  homeGoals: number | null;
  awayGoals: number | null;
} {
  if (!scores || scores.length < 2) {
    return { homeGoals: null, awayGoals: null };
  }

  const homeGoals = parseScoreEntryValue(scores[0] ?? null);
  const awayGoals = parseScoreEntryValue(scores[1] ?? null);
  if (homeGoals === null || awayGoals === null) {
    return { homeGoals: null, awayGoals: null };
  }
  return { homeGoals, awayGoals };
}

export function mapScoreEventToStatusPayload(
  event: TheOddsApiScoreEvent,
  leagueCode: string,
): {
  canonicalFixtureId: string;
  status: 'scheduled' | 'live' | 'finished';
  homeGoals: number | null;
  awayGoals: number | null;
  leagueCode: string;
} {
  const { homeGoals, awayGoals } = parseScoreGoals(event.scores);
  const status = event.completed ? 'finished' : 'live';
  return {
    canonicalFixtureId: canonicalFixtureIdFromVendorEvent(event.id),
    status,
    homeGoals,
    awayGoals,
    leagueCode,
  };
}

export async function fetchSportScores(
  apiKey: string,
  leagueSlug: string,
  daysFrom = 1,
): Promise<FetchSportScoresResult> {
  const sportKey = LEAGUE_TO_SPORT_KEY[leagueSlug] ?? leagueSlug;
  const url = new URL(`/v4/sports/${sportKey}/scores`, API_HOST);
  url.searchParams.set('apiKey', apiKey);
  url.searchParams.set('daysFrom', String(daysFrom));

  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `[the-odds-api] scores ${response.status} for ${sportKey}: ${body.slice(0, 200)}`,
    );
  }

  const events = (await response.json()) as TheOddsApiScoreEvent[];
  return {
    events,
    requestsRemaining: response.headers.get('x-requests-remaining') ?? undefined,
  };
}

export function isSameTeams(a: TheOddsApiEvent, b: TheOddsApiScoreEvent): boolean {
  return a.home_team === b.home_team && a.away_team === b.away_team;
}
