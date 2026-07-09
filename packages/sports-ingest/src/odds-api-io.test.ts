import { describe, expect, it } from 'vitest';
import { mapOddsApiIoEventOddsToMessages, type OddsApiIoEventOdds } from './odds-api-io';
import { ODDS_API_IO_VENDOR } from './vendor-chain';

const sampleOdds: OddsApiIoEventOdds = {
  id: 62924717,
  home: 'Arsenal',
  away: 'Chelsea',
  date: '2026-06-20T15:00:00.000Z',
  status: 'pending',
  bookmakers: {
    Bet365: [
      {
        name: 'ML',
        odds: [{ home: '2.10', draw: '3.40', away: '3.20' }],
        updatedAt: '2026-06-16T10:00:00.000Z',
      },
      {
        name: 'Over/Under',
        odds: [{ max: 2.5, over: '1.90', under: '1.95' }],
        updatedAt: '2026-06-16T10:00:00.000Z',
      },
    ],
  },
};

describe('mapOddsApiIoEventOddsToMessages', () => {
  it('maps ML + OU 2.5 to C1 event_upsert + odds_upsert messages', () => {
    const capturedAt = '2026-06-16T12:00:00.000Z';
    const messages = mapOddsApiIoEventOddsToMessages(sampleOdds, 'epl', capturedAt, 'Bet365');

    expect(messages.length).toBeGreaterThan(1);

    const upsert = messages[0];
    expect(upsert?.type).toBe('event_upsert');
    if (upsert?.type !== 'event_upsert') return;

    expect(upsert.fixture.fixtureId).toBe(`${ODDS_API_IO_VENDOR}:62924717`);
    expect(upsert.fixture.homeName).toBe('Arsenal');
    expect(upsert.fixture.leagueCode).toBe('epl');
    expect(upsert.markets.map((m) => m.marketType)).toEqual(
      expect.arrayContaining(['match_1x2', 'totals_2_5']),
    );

    const oddsMessages = messages.filter((m) => m.type === 'odds_upsert');
    expect(oddsMessages.length).toBeGreaterThanOrEqual(5);
  });

  it('returns empty when no bookmakers', () => {
    const empty: OddsApiIoEventOdds = { ...sampleOdds, bookmakers: {} };
    expect(mapOddsApiIoEventOddsToMessages(empty, 'epl', '2026-06-16T12:00:00.000Z')).toEqual([]);
  });
});
