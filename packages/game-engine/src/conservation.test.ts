/**
 * Package-level conservation — all 12 casino games.
 * Invariant: stake = payout + houseEdgeLeg (Σ=0 double-entry legs).
 */

import { describe, expect, it } from 'vitest';
import { Decimal } from '@phonara/money';
import { floatStream } from './fairness/float';
import { GAME_CODES, getGame, type GameCode } from './registry';

import './games/crash';
import './games/limbo';
import './games/dice';
import './games/mines';
import './games/hilo';
import './games/plinko';
import './games/mint-reels';
import './games/gold-rush';
import './games/roulette';
import './games/blackjack';
import './games/deepshaft';
import './games/momentum';

const STAKE_VECTORS = ['1', '7.77', '100', '1000.50', '99999.99'] as const;

/** Canonical selection per game — matches verifier contract + SQL parity shapes. */
const GAME_SELECTIONS: Record<GameCode, unknown> = {
  crash: { autoCashout: '2.00' },
  limbo: { target: '2.00' },
  dice: { target: '50.00', direction: 'over' },
  mines: { mineCount: 5, revealedCells: [0, 2, 4] },
  hilo: { startCard: 9, guesses: ['higher'] },
  plinko: { rows: 16, risk: 'medium' },
  mint_reels: { lines: 20 },
  gold_rush: { lines: 20 },
  roulette: { bets: [{ type: 'red', value: null, stakeWeight: 1 }] },
  blackjack: { actions: [{ seat: 0, move: 'stand' }] },
  deepshaft: { riskTier: 'standard', targetDepth: 5 },
  momentum: { comboBefore: 3, cashOut: true },
};

function assertStakeConserved(stake: Decimal, payout: Decimal, houseEdgeLeg: Decimal): void {
  expect(payout.plus(houseEdgeLeg).eq(stake)).toBe(true);
  if (houseEdgeLeg.isNegative()) {
    expect(payout.gt(stake)).toBe(true);
  } else if (houseEdgeLeg.isZero()) {
    expect(payout.eq(stake)).toBe(true);
  } else {
    expect(payout.lt(stake)).toBe(true);
  }
}

describe('casino conservation (12 games)', () => {
  for (const code of GAME_CODES) {
    it(`${code} conserves stake = payout + houseEdgeLeg across vector seeds`, async () => {
      const definition = getGame(code);
      const selection = GAME_SELECTIONS[code];

      for (let seedCase = 0; seedCase < 40; seedCase += 1) {
        const serverSeed = `conservation:${code}:${seedCase}`;
        const clientSeed = `client_${seedCase % 17}`;
        const nonce = (seedCase % 251) + 1;
        const floats = await floatStream(serverSeed, clientSeed, nonce, definition.floatCount);
        const result = definition.resultFromFloats(floats, selection);

        for (const stakeStr of STAKE_VECTORS) {
          const stake = new Decimal(stakeStr);
          const { payout, houseEdgeLeg } = definition.settle(stake, selection, result);
          assertStakeConserved(stake, payout, houseEdgeLeg);
        }
      }
    });
  }

  it('high multiplier wins keep conservation with negative houseEdgeLeg', async () => {
    const highMultCases: Array<{
      code: GameCode;
      serverSeed: string;
      clientSeed: string;
      nonce: number;
      selection: unknown;
    }> = [
      {
        code: 'gold_rush',
        serverSeed: 'highmult-seed-380',
        clientSeed: 'client',
        nonce: 1,
        selection: { lines: 1 },
      },
      {
        code: 'plinko',
        serverSeed: 'plinko-hm-125',
        clientSeed: 'client',
        nonce: 1,
        selection: { rows: 16, risk: 'high' },
      },
      {
        code: 'blackjack',
        serverSeed: 'deadbeef00112233445566778899aabbccddeeff00112233445566778899aabb',
        clientSeed: 'parity_client',
        nonce: 1,
        selection: { actions: [{ seat: 0, move: 'stand' }] },
      },
      {
        code: 'momentum',
        serverSeed: 'deadbeef00112233445566778899aabbccddeeff00112233445566778899aabb',
        clientSeed: 'parity_client',
        nonce: 1,
        selection: { comboBefore: 3, cashOut: true },
      },
    ];

    const stake = new Decimal('1000');

    for (const probe of highMultCases) {
      const definition = getGame(probe.code);
      const floats = await floatStream(
        probe.serverSeed,
        probe.clientSeed,
        probe.nonce,
        definition.floatCount,
      );
      const result = definition.resultFromFloats(floats, probe.selection);
      const { payout, houseEdgeLeg } = definition.settle(stake, probe.selection, result);
      assertStakeConserved(stake, payout, houseEdgeLeg);
      expect(payout.gt(stake)).toBe(true);
      expect(houseEdgeLeg.isNegative()).toBe(true);
    }
  });
});
