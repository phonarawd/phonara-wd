import { describe, expect, it } from 'vitest';

import {
  EVENTS_HUB_ROUTE,
  EVENTS_SEASON_CARDS,
  listEventsSeasonCards,
  parseGoldenEarthStatusSnapshot,
  parseGoldenEarthTapResult,
  resolveEventsTapBlocked,
} from '../events-hub-display-contract';
import { EARN_PLAY_ROUTE } from '../earn-play-display-contract';
import { GOLDEN_EARTH_PRIMARY_TAP_ROUTE } from '../golden-earth-display-contract';

describe('events-hub-display-contract', () => {
  it('locks hub route to Golden Earth primary tap', () => {
    expect(EVENTS_HUB_ROUTE).toBe('/events');
    expect(EVENTS_HUB_ROUTE).toBe(GOLDEN_EARTH_PRIMARY_TAP_ROUTE);
  });

  it('links season roulette card to /earn/play (not casino)', () => {
    const roulette = EVENTS_SEASON_CARDS.find((card) => card.id === 'roulette');
    expect(roulette?.route).toBe(EARN_PLAY_ROUTE);
    expect(listEventsSeasonCards()).toHaveLength(3);
  });

  it('parses status + tap RPC payloads without client math', () => {
    const status = parseGoldenEarthStatusSnapshot({
      ok: true,
      authenticated: true,
      global_total: 100,
      global_until_jackpot: 5,
      tap_count: 2,
      daily_cap: 10,
      remaining: 8,
      earned_phon_today: '1.500000',
      max_phon_today_estimate: '12.000000',
      golden_hour_active: false,
      tier: 'bronze',
    });
    expect(status?.remaining).toBe(8);
    expect(status?.earnedPhonToday).toBe('1.500000');

    const tap = parseGoldenEarthTapResult({
      ok: true,
      phon_awarded: '0.500000',
      remaining: 7,
      daily_cap: 10,
      is_jackpot: false,
      is_global_jackpot: false,
    });
    expect(tap?.phonAwarded).toBe('0.500000');
    expect(
      resolveEventsTapBlocked({ authenticated: true, systemHalted: false, remaining: 0 }),
    ).toBe(true);
  });
});
