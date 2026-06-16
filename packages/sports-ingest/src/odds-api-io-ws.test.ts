import { describe, expect, it } from 'vitest';
import {
  buildOddsApiIoWsUrl,
  extractWsSeq,
  mapOddsApiIoWsOddsMessage,
  mapOddsApiIoWsScoreMessage,
  mapOddsApiIoWsStatusMessage,
} from './odds-api-io-ws';

describe('buildOddsApiIoWsUrl', () => {
  it('includes leagues, markets, channels, and lastSeq', () => {
    const url = buildOddsApiIoWsUrl({
      apiKey: 'test-key',
      ioLeagueSlugs: ['england-premier-league'],
      markets: 'ML,Totals',
      channels: 'odds,scores,status',
      lastSeq: 482917,
    });

    expect(url).toContain('wss://api.odds-api.io/v3/ws');
    expect(url).toContain('apiKey=test-key');
    expect(url).toContain('leagues=england-premier-league');
    expect(url).toContain('lastSeq=482917');
  });
});

describe('mapOddsApiIoWsOddsMessage', () => {
  it('maps updated ML frame to C1 messages', () => {
    const capturedAt = '2026-06-16T12:00:00.000Z';
    const messages = mapOddsApiIoWsOddsMessage(
      {
        type: 'updated',
        seq: 100,
        id: '63017989',
        bookie: 'Bet365',
        markets: [
          {
            name: 'ML',
            odds: [{ home: '2.10', draw: '3.40', away: '3.20' }],
          },
        ],
      },
      {
        leagueCode: 'epl',
        home: 'Arsenal',
        away: 'Chelsea',
        date: '2026-06-20T15:00:00.000Z',
        status: 'scheduled',
      },
      capturedAt,
    );

    expect(messages.length).toBeGreaterThan(1);
    expect(messages[0]?.type).toBe('event_upsert');
  });

  it('maps deleted to event_remove', () => {
    const messages = mapOddsApiIoWsOddsMessage(
      { type: 'deleted', id: '99', bookie: 'Bet365' },
      { leagueCode: 'epl' },
      '2026-06-16T12:00:00.000Z',
    );
    expect(messages).toEqual([
      {
        type: 'event_remove',
        fixtureId: 'odds-api-io:99',
        reason: 'ws_deleted:Bet365',
      },
    ]);
  });
});

describe('mapOddsApiIoWsStatusMessage', () => {
  it('maps settled status with auto-settle when scores present', () => {
    const payload = mapOddsApiIoWsStatusMessage({
      type: 'status',
      id: 42,
      status: 'settled',
      scores: { home: 2, away: 1, periods: { ft: { home: 2, away: 1 } } },
    });

    expect(payload).toMatchObject({
      canonicalFixtureId: 'odds-api-io:42',
      status: 'finished',
      homeGoals: 2,
      awayGoals: 1,
      autoSettle: true,
    });
  });
});

describe('mapOddsApiIoWsScoreMessage', () => {
  it('maps score channel to live status payload', () => {
    const payload = mapOddsApiIoWsScoreMessage({
      type: 'score',
      id: 7,
      scores: { home: 1, away: 0 },
    });

    expect(payload.status).toBe('live');
    expect(payload.homeGoals).toBe(1);
    expect(payload.awayGoals).toBe(0);
  });
});

describe('extractWsSeq', () => {
  it('returns finite seq numbers only', () => {
    expect(extractWsSeq({ seq: 42 })).toBe(42);
    expect(extractWsSeq({ seq: NaN })).toBeUndefined();
  });
});
