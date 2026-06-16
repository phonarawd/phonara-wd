import { describe, expect, it } from 'vitest';
import {
  decideDualFeedSettle,
  findSecondaryFinishedMatch,
  normalizeTeamNameForMatch,
  teamsMatchForSettle,
} from './settle-score-match';

describe('settle-score-match', () => {
  it('normalizes team names for cross-vendor match', () => {
    expect(normalizeTeamNameForMatch('Manchester United FC')).toBe('manchesterunited');
    expect(teamsMatchForSettle('Arsenal FC', 'Chelsea', 'Arsenal', 'Chelsea FC')).toBe(true);
  });

  it('finds secondary match on same date and teams', () => {
    const primary = {
      canonicalFixtureId: 'the-odds-api:abc',
      leagueCode: 'epl',
      homeTeam: 'Liverpool FC',
      awayTeam: 'Everton',
      kickoffAt: '2026-04-02T15:00:00Z',
      homeGoals: 2,
      awayGoals: 1,
      source: 'the-odds-api',
    };
    const secondary = [
      {
        leagueCode: 'epl',
        competitionCode: 'PL',
        matchId: 99,
        utcDate: '2026-04-02T16:00:00Z',
        homeTeam: 'Liverpool',
        awayTeam: 'Everton FC',
        homeGoals: 2,
        awayGoals: 1,
      },
    ];
    const match = findSecondaryFinishedMatch(primary, secondary);
    expect(match?.matchId).toBe(99);
  });

  it('skips on score mismatch when dual feed agrees teams', () => {
    const primary = {
      canonicalFixtureId: 'the-odds-api:abc',
      leagueCode: 'epl',
      homeTeam: 'Liverpool',
      awayTeam: 'Everton',
      kickoffAt: '2026-04-02T15:00:00Z',
      homeGoals: 2,
      awayGoals: 1,
      source: 'the-odds-api',
    };
    const secondary = {
      leagueCode: 'epl',
      competitionCode: 'PL',
      matchId: 1,
      utcDate: '2026-04-02T16:00:00Z',
      homeTeam: 'Liverpool',
      awayTeam: 'Everton',
      homeGoals: 1,
      awayGoals: 1,
    };
    const decision = decideDualFeedSettle(primary, secondary, true);
    expect(decision.action).toBe('skip');
    if (decision.action === 'skip') {
      expect(decision.mismatch).toBe(true);
    }
  });

  it('settles when dual feed scores agree', () => {
    const primary = {
      canonicalFixtureId: 'the-odds-api:abc',
      leagueCode: 'epl',
      homeTeam: 'Liverpool',
      awayTeam: 'Everton',
      kickoffAt: '2026-04-02T15:00:00Z',
      homeGoals: 2,
      awayGoals: 1,
      source: 'the-odds-api',
    };
    const secondary = {
      leagueCode: 'epl',
      competitionCode: 'PL',
      matchId: 1,
      utcDate: '2026-04-02T16:00:00Z',
      homeTeam: 'Liverpool',
      awayTeam: 'Everton',
      homeGoals: 2,
      awayGoals: 1,
    };
    const decision = decideDualFeedSettle(primary, secondary, true);
    expect(decision.action).toBe('settle');
    expect(decision.reason).toBe('dual_feed_agreement');
  });
});
