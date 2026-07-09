/**
 * football-data.org v4 — secondary score feed for dual-feed settlement (football leagues).
 * Free tier: register at https://www.football-data.org/ · server-only · never VITE_*.
 */
export const FOOTBALL_DATA_ORG_VENDOR = 'football-data-org';

const API_HOST = 'https://api.football-data.org/v4';

/** PHONARA league slug → football-data.org competition code */
export const LEAGUE_TO_FOOTBALL_DATA_COMP: Readonly<Record<string, string>> = {
  'world-cup': 'WC',
  epl: 'PL',
  bundesliga: 'BL1',
  'serie-a': 'SA',
  'la-liga': 'PD',
  'ligue-1': 'FL1',
  mls: 'MLS',
};

export interface FootballDataMatch {
  readonly id: number;
  readonly utcDate: string;
  readonly status: string;
  readonly homeTeam: { readonly name: string; readonly shortName?: string };
  readonly awayTeam: { readonly name: string; readonly shortName?: string };
  readonly score?: {
    readonly fullTime?: { readonly home: number | null; readonly away: number | null };
  };
}

export interface FootballDataFinishedScore {
  readonly leagueCode: string;
  readonly competitionCode: string;
  readonly matchId: number;
  readonly utcDate: string;
  readonly homeTeam: string;
  readonly awayTeam: string;
  readonly homeGoals: number;
  readonly awayGoals: number;
}

export interface FetchFootballDataFinishedResult {
  readonly scores: readonly FootballDataFinishedScore[];
}

function parseFinishedScore(
  match: FootballDataMatch,
  leagueCode: string,
  competitionCode: string,
): FootballDataFinishedScore | null {
  if (match.status !== 'FINISHED') return null;
  const homeGoals = match.score?.fullTime?.home;
  const awayGoals = match.score?.fullTime?.away;
  if (homeGoals == null || awayGoals == null) {
    return null;
  }

  return {
    leagueCode,
    competitionCode,
    matchId: match.id,
    utcDate: match.utcDate,
    homeTeam: match.homeTeam.name,
    awayTeam: match.awayTeam.name,
    homeGoals,
    awayGoals,
  };
}

export async function fetchFootballDataFinishedScores(
  apiToken: string,
  leagueCode: string,
  daysFrom = 3,
): Promise<FetchFootballDataFinishedResult> {
  const competitionCode = LEAGUE_TO_FOOTBALL_DATA_COMP[leagueCode];
  if (!competitionCode) {
    return { scores: [] };
  }

  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - Math.max(1, daysFrom));

  const dateFrom = start.toISOString().slice(0, 10);
  const dateTo = end.toISOString().slice(0, 10);

  const url = new URL(`/v4/competitions/${competitionCode}/matches`, API_HOST);
  url.searchParams.set('status', 'FINISHED');
  url.searchParams.set('dateFrom', dateFrom);
  url.searchParams.set('dateTo', dateTo);

  const response = await fetch(url, {
    headers: {
      'X-Auth-Token': apiToken,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `[football-data-org] ${response.status} for ${competitionCode}: ${body.slice(0, 200)}`,
    );
  }

  const payload = (await response.json()) as { matches?: FootballDataMatch[] };
  const scores: FootballDataFinishedScore[] = [];

  for (const match of payload.matches ?? []) {
    const parsed = parseFinishedScore(match, leagueCode, competitionCode);
    if (parsed) scores.push(parsed);
  }

  return { scores };
}
