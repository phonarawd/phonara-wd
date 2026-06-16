import { describe, expect, it } from 'vitest';
import { mapScoreEventToStatusPayload, parseScoreGoals } from './the-odds-api-scores';

describe('parseScoreGoals', () => {
  it('parses home/away integer scores', () => {
    expect(parseScoreGoals(['2', '1'])).toEqual({ homeGoals: 2, awayGoals: 1 });
  });

  it('returns null for incomplete scores', () => {
    expect(parseScoreGoals(['2', null])).toEqual({ homeGoals: null, awayGoals: null });
  });

  it('parses object score entries (World Cup feed)', () => {
    expect(
      parseScoreGoals([
        { name: 'Qatar', score: '1' },
        { name: 'Switzerland', score: '1' },
      ]),
    ).toEqual({ homeGoals: 1, awayGoals: 1 });
  });
});

describe('mapScoreEventToStatusPayload', () => {
  it('maps completed event to finished status', () => {
    const mapped = mapScoreEventToStatusPayload(
      {
        id: 'abc',
        sport_key: 'soccer_epl',
        commence_time: '2026-06-20T15:00:00Z',
        completed: true,
        home_team: 'A',
        away_team: 'B',
        scores: ['1', '0'],
      },
      'epl',
    );
    expect(mapped.status).toBe('finished');
    expect(mapped.canonicalFixtureId).toBe('the-odds-api:abc');
    expect(mapped.homeGoals).toBe(1);
  });
});
