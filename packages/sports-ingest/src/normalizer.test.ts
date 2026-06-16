import { describe, expect, it } from 'vitest';
import { normalizeVendorEventUpsert, normalizeVendorOddsPatch } from './normalizer';

describe('normalizeVendorEventUpsert', () => {
  it('maps vendor event to C1 event_upsert', () => {
    const message = normalizeVendorEventUpsert(
      'odds-api-io',
      {
        id: 42,
        league: { slug: 'epl' },
        home: 'Arsenal',
        away: 'Chelsea',
        commenceTime: '2026-06-20T15:00:00.000Z',
        status: 'scheduled',
      },
      [
        {
          key: 'match_1x2',
          outcomes: [
            { id: 'h', name: 'Home', price: '2.10' },
            { id: 'd', name: 'Draw', price: '3.40' },
            { id: 'a', name: 'Away', price: '3.20' },
          ],
        },
      ],
    );

    expect(message.type).toBe('event_upsert');
    if (message.type !== 'event_upsert') return;
    expect(message.fixture.fixtureId).toBe('odds-api-io:42');
    expect(message.fixture.leagueCode).toBe('epl');
    expect(message.markets[0]?.outcomes).toHaveLength(3);
  });
});

describe('normalizeVendorOddsPatch', () => {
  it('emits odds_upsert with decimal string', () => {
    const message = normalizeVendorOddsPatch('outcome-1', '2.05', '2026-06-16T00:00:00.000Z');
    expect(message).toEqual({
      type: 'odds_upsert',
      outcomeId: 'outcome-1',
      odds: '2.05',
      capturedAt: '2026-06-16T00:00:00.000Z',
    });
  });
});
