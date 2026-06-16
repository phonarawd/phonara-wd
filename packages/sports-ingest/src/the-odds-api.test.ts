import { describe, expect, it } from 'vitest';
import {
  mapTheOddsApiEventToMessages,
  type TheOddsApiEvent,
  THE_ODDS_API_VENDOR,
} from './the-odds-api';

const sampleEvent: TheOddsApiEvent = {
  id: 'abc123',
  sport_key: 'soccer_epl',
  commence_time: '2026-06-20T15:00:00.000Z',
  home_team: 'Arsenal',
  away_team: 'Chelsea',
  bookmakers: [
    {
      key: 'williamhill',
      title: 'William Hill',
      last_update: '2026-06-16T10:00:00.000Z',
      markets: [
        {
          key: 'h2h',
          outcomes: [
            { name: 'Arsenal', price: 2.1 },
            { name: 'Draw', price: 3.4 },
            { name: 'Chelsea', price: 3.2 },
          ],
        },
      ],
    },
  ],
};

describe('mapTheOddsApiEventToMessages', () => {
  it('maps h2h to C1 event_upsert + odds_upsert messages', () => {
    const capturedAt = '2026-06-16T12:00:00.000Z';
    const messages = mapTheOddsApiEventToMessages(sampleEvent, 'epl', capturedAt);

    expect(messages.length).toBeGreaterThan(1);

    const upsert = messages[0];
    expect(upsert?.type).toBe('event_upsert');
    if (upsert?.type !== 'event_upsert') return;

    expect(upsert.fixture.fixtureId).toBe(`${THE_ODDS_API_VENDOR}:abc123`);
    expect(upsert.fixture.homeName).toBe('Arsenal');
    expect(upsert.fixture.awayName).toBe('Chelsea');
    expect(upsert.markets[0]?.marketType).toBe('match_1x2');

    const oddsMessages = messages.filter((m) => m.type === 'odds_upsert');
    expect(oddsMessages).toHaveLength(3);
    expect(oddsMessages[0]).toMatchObject({
      type: 'odds_upsert',
      odds: '2.1',
      capturedAt,
    });
  });

  it('returns empty when no bookmakers', () => {
    const empty: TheOddsApiEvent = { ...sampleEvent, bookmakers: [] };
    expect(mapTheOddsApiEventToMessages(empty, 'epl', '2026-06-16T12:00:00.000Z')).toEqual([]);
  });
});
