import { describe, expect, it } from 'vitest';

import {
  EARN_PLAY_FORBIDDEN_CASINO_ROUTE,
  EARN_PLAY_ROUTE,
  isCasinoRouletteRoute,
  parseEarnPlayRouletteQuota,
  parseEarnPlaySpinResult,
  resolveEarnPlaySpinBlocked,
  SPIN_ROULETTE_RPC,
} from '../earn-play-display-contract';

describe('earn-play-display-contract', () => {
  it('binds apptech play route and spin RPC', () => {
    expect(EARN_PLAY_ROUTE).toBe('/earn/play');
    expect(SPIN_ROULETTE_RPC).toBe('rpc_spin_roulette');
    expect(isCasinoRouletteRoute(EARN_PLAY_FORBIDDEN_CASINO_ROUTE)).toBe(true);
    expect(isCasinoRouletteRoute(EARN_PLAY_ROUTE)).toBe(false);
  });

  it('parses hub quota and spin result from RPC payloads', () => {
    expect(
      parseEarnPlayRouletteQuota({
        roulette: { remaining: 1, used: 0, max: 1 },
      }),
    ).toEqual({ remaining: 1, used: 0, max: 1 });

    expect(
      parseEarnPlaySpinResult({
        already_spun: false,
        phon_awarded: '50.000000',
        prize_index: 3,
        seed_hash: 'abc',
      }),
    ).toEqual({
      alreadySpun: false,
      phonAwarded: '50.000000',
      prizeIndex: 3,
      seedHash: 'abc',
    });

    expect(resolveEarnPlaySpinBlocked({ authenticated: true, remaining: 0, spinning: false })).toBe(
      true,
    );
  });
});
