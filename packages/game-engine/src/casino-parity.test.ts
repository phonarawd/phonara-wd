import { describe, expect, it } from 'vitest';
import { floatStream } from './fairness/float';
import { crashDefinition } from './games/crash';
import { diceDefinition } from './games/dice';
import { hiloDefinition } from './games/hilo';
import { limboDefinition } from './games/limbo';
import { minesDefinition } from './games/mines';
import { plinkoDefinition } from './games/plinko';
import { deepshaftDefinition } from './games/deepshaft';
import { momentumDefinition } from './games/momentum';
import { mintReelsDefinition } from './games/mint-reels';
import { goldRushDefinition } from './games/gold-rush';
import { rouletteDefinition } from './games/roulette';
import { blackjackDefinition } from './games/blackjack';
import type { GameDefinition } from './registry';

const SERVER_SEED = 'deadbeef00112233445566778899aabbccddeeff00112233445566778899aabb';
const CLIENT_SEED = 'parity_client';
const NONCE = 1;

async function resultFor<Selection, Result>(
  definition: GameDefinition<Selection, Result>,
  selection: Selection,
): Promise<Result> {
  const floats = await floatStream(SERVER_SEED, CLIENT_SEED, NONCE, definition.floatCount);
  return definition.resultFromFloats(floats, selection);
}

describe('casino TS parity vectors', () => {
  it('locks Dice over/under constants', async () => {
    await expect(
      resultFor(diceDefinition, { target: '50.00', direction: 'over' }),
    ).resolves.toEqual({
      roll: 18.37,
      won: false,
    });
    await expect(
      resultFor(diceDefinition, { target: '25.00', direction: 'under' }),
    ).resolves.toEqual({
      roll: 18.37,
      won: true,
    });
  });

  it('locks Limbo target constants', async () => {
    await expect(resultFor(limboDefinition, { target: '2.00' })).resolves.toEqual({
      resultMultiplier: 1.21,
      won: false,
    });
    await expect(resultFor(limboDefinition, { target: '5.00' })).resolves.toEqual({
      resultMultiplier: 1.21,
      won: false,
    });
  });

  it('locks Crash auto-cashout constants', async () => {
    await expect(resultFor(crashDefinition, { autoCashout: '2.00' })).resolves.toEqual({
      crashMultiplier: 1.21,
      cashedOut: false,
      cashoutMultiplier: 0,
    });
    await expect(resultFor(crashDefinition, { autoCashout: '5.00' })).resolves.toEqual({
      crashMultiplier: 1.21,
      cashedOut: false,
      cashoutMultiplier: 0,
    });
  });

  it('locks Mines position constants', async () => {
    await expect(
      resultFor(minesDefinition, { mineCount: 3, revealedCells: [0, 1, 2] }),
    ).resolves.toEqual({
      minePositions: [6, 0, 4],
      hitMine: true,
    });
    await expect(
      resultFor(minesDefinition, { mineCount: 24, revealedCells: [0] }),
    ).resolves.toEqual({
      minePositions: [
        6, 0, 4, 5, 13, 19, 11, 8, 20, 14, 16, 21, 24, 1, 3, 10, 17, 9, 12, 18, 2, 7, 23, 15,
      ],
      hitMine: true,
    });
  });

  it('locks HiLo card path constants', async () => {
    await expect(resultFor(hiloDefinition, { startCard: 7, guesses: ['higher'] })).resolves.toEqual(
      {
        cards: [7, 3],
        rounds: [{ card: 7, guess: 'higher', correct: false, multiplier: 0 }],
        won: false,
      },
    );
    await expect(
      resultFor(hiloDefinition, { startCard: null, guesses: ['skip', 'higher', 'lower'] }),
    ).resolves.toEqual({
      cards: [3, 6, 12, 4],
      rounds: [
        { card: 3, guess: 'skip', correct: true, multiplier: 1 },
        { card: 6, guess: 'higher', correct: true, multiplier: 1.83 },
        { card: 12, guess: 'lower', correct: true, multiplier: 2.14 },
      ],
      won: true,
    });
  });

  it('locks Plinko path constants', async () => {
    await expect(resultFor(plinkoDefinition, { rows: 12, risk: 'low' })).resolves.toEqual({
      path: [0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 1, 1],
      bucket: 5,
      bucketMultiplier: '0.9',
    });
    await expect(resultFor(plinkoDefinition, { rows: 16, risk: 'high' })).resolves.toEqual({
      path: [0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1],
      bucket: 7,
      bucketMultiplier: '0.3',
    });
  });

  it('locks Deepshaft descent constants', async () => {
    await expect(
      resultFor(deepshaftDefinition, { riskTier: 'standard', targetDepth: 5 }),
    ).resolves.toEqual({
      levels: [
        { depth: 1, outcome: 'gold', levelMultiplier: 1.06 },
        { depth: 2, outcome: 'gold', levelMultiplier: 1.24 },
        { depth: 3, outcome: 'gold', levelMultiplier: 1.59 },
        { depth: 4, outcome: 'gold', levelMultiplier: 2.27 },
        { depth: 5, outcome: 'gold', levelMultiplier: 3.56 },
      ],
      reachedDepth: 5,
      caveIn: false,
      totalMultiplier: 1.51,
      won: true,
    });
  });

  it('locks Mint Reels line constants', async () => {
    await expect(resultFor(mintReelsDefinition, { lines: 20 })).resolves.toEqual({
      totalMultiplier: 0,
    });
    await expect(resultFor(mintReelsDefinition, { lines: 1 })).resolves.toEqual({
      totalMultiplier: 0,
    });
  });

  it('locks Gold Rush line constants', async () => {
    await expect(resultFor(goldRushDefinition, { lines: 20 })).resolves.toEqual({
      totalMultiplier: 0,
    });
    await expect(resultFor(goldRushDefinition, { lines: 1 })).resolves.toEqual({
      totalMultiplier: 0,
    });
  });

  it('locks Roulette bet constants', async () => {
    await expect(
      resultFor(rouletteDefinition, { bets: [{ type: 'red', value: null, stakeWeight: 1 }] }),
    ).resolves.toEqual({
      winningNumber: 6,
      totalMultiplier: 0,
    });
    await expect(
      resultFor(rouletteDefinition, { bets: [{ type: 'straight', value: 7, stakeWeight: 1 }] }),
    ).resolves.toEqual({
      winningNumber: 6,
      totalMultiplier: 0,
    });
  });

  it('locks Blackjack action constants', async () => {
    await expect(
      resultFor(blackjackDefinition, { actions: [{ seat: 0, move: 'stand' }] }),
    ).resolves.toEqual({
      totalMultiplier: 2,
    });
    await expect(
      resultFor(blackjackDefinition, {
        actions: [
          { seat: 0, move: 'hit' },
          { seat: 0, move: 'stand' },
        ],
      }),
    ).resolves.toEqual({
      totalMultiplier: 2,
    });
  });

  it('locks Momentum play and cash-out constants', async () => {
    await expect(
      resultFor(momentumDefinition, { comboBefore: 0, cashOut: false }),
    ).resolves.toEqual({
      won: false,
      roll: 18.37,
      comboBefore: 0,
      comboAfter: 0,
      comboMultiplier: 0,
      cashedOut: false,
      totalMultiplier: 0,
    });
    await expect(resultFor(momentumDefinition, { comboBefore: 3, cashOut: true })).resolves.toEqual(
      {
        won: true,
        roll: 0,
        comboBefore: 3,
        comboAfter: 0,
        comboMultiplier: 16.46,
        cashedOut: true,
        totalMultiplier: 16.29,
      },
    );
  });
});
