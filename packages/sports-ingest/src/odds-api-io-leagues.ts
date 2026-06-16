import { LEAGUE_TO_ODDS_API_IO } from './odds-api-io';

export const WS_CURSOR_LEAGUE_CODE = 'ws';

/** Reverse map: Odds-API.io league slug → PHONARA league code */
export const IO_LEAGUE_TO_PHONARA: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(LEAGUE_TO_ODDS_API_IO).map(([phonara, { league }]) => [league, phonara]),
);

export function resolveIoLeagueSlugs(phonaraLeagues: readonly string[]): string[] {
  const slugs: string[] = [];
  for (const phonara of phonaraLeagues) {
    const mapped = LEAGUE_TO_ODDS_API_IO[phonara];
    if (mapped) slugs.push(mapped.league);
  }
  return slugs;
}

export function phonaraLeagueForIoSlug(ioSlug: string, fallback = 'unknown'): string {
  return IO_LEAGUE_TO_PHONARA[ioSlug] ?? fallback;
}

export function canonicalOddsApiIoFixtureId(eventId: string | number): string {
  return `odds-api-io:${String(eventId)}`;
}
