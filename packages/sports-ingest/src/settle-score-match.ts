import type { FootballDataFinishedScore } from './football-data-org';

export interface PrimaryFinishedScore {
  readonly canonicalFixtureId: string;
  readonly leagueCode: string;
  readonly homeTeam: string;
  readonly awayTeam: string;
  readonly kickoffAt: string;
  readonly homeGoals: number;
  readonly awayGoals: number;
  readonly source: string;
}

export type DualFeedSettleDecision =
  | { readonly action: 'settle'; readonly reason: string }
  | { readonly action: 'skip'; readonly reason: string; readonly mismatch?: boolean };

/** Normalize team names for cross-vendor fuzzy match (football). */
export function normalizeTeamNameForMatch(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\b(fc|cf|sc|afc)\b/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export function teamsMatchForSettle(
  homeA: string,
  awayA: string,
  homeB: string,
  awayB: string,
): boolean {
  const normHomeA = normalizeTeamNameForMatch(homeA);
  const normAwayA = normalizeTeamNameForMatch(awayA);
  const normHomeB = normalizeTeamNameForMatch(homeB);
  const normAwayB = normalizeTeamNameForMatch(awayB);

  if (!normHomeA || !normAwayA || !normHomeB || !normAwayB) return false;

  const direct =
    normHomeA === normHomeB &&
    (normAwayA === normAwayB ||
      normAwayA.includes(normAwayB) ||
      normAwayB.includes(normAwayA));
  if (direct) return true;

  const swapped =
    normHomeA === normAwayB &&
    (normAwayA === normHomeB ||
      normAwayA.includes(normHomeB) ||
      normHomeB.includes(normAwayA));
  return swapped;
}

export function sameUtcDate(isoA: string, isoB: string): boolean {
  return isoA.slice(0, 10) === isoB.slice(0, 10);
}

export function findSecondaryFinishedMatch(
  primary: PrimaryFinishedScore,
  secondaryScores: readonly FootballDataFinishedScore[],
): FootballDataFinishedScore | null {
  for (const candidate of secondaryScores) {
    if (candidate.leagueCode !== primary.leagueCode) continue;
    if (!sameUtcDate(primary.kickoffAt, candidate.utcDate)) continue;
    if (teamsMatchForSettle(primary.homeTeam, primary.awayTeam, candidate.homeTeam, candidate.awayTeam)) {
      return candidate;
    }
  }
  return null;
}

export function decideDualFeedSettle(
  primary: PrimaryFinishedScore,
  secondary: FootballDataFinishedScore | null,
  strict: boolean,
): DualFeedSettleDecision {
  if (!secondary) {
    if (strict) {
      return {
        action: 'skip',
        reason: 'secondary_feed_no_match',
      };
    }
    return {
      action: 'settle',
      reason: 'primary_only_no_secondary_match',
    };
  }

  if (
    primary.homeGoals !== secondary.homeGoals ||
    primary.awayGoals !== secondary.awayGoals
  ) {
    return {
      action: 'skip',
      reason: 'score_mismatch',
      mismatch: true,
    };
  }

  return {
    action: 'settle',
    reason: 'dual_feed_agreement',
  };
}
