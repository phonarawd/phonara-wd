import { describe, expect, it } from 'vitest';
import { hashServerSeed } from '../seed';
import { recomputeResult, verifyRound, type GameCode } from '../verifier';
import { floatStream } from '../float';

const GAMES: GameCode[] = [
  'crash',
  'dice',
  'mines',
  'plinko',
  'limbo',
  'hilo',
  'mint_reels',
  'gold_rush',
  'blackjack',
  'roulette',
  'deepshaft',
  'momentum',
];

describe('fairness verifier contract', () => {
  it('verifyRound is registered for all 12 casino games', async () => {
    const serverSeed = 'contract-seed-001';
    const clientSeed = 'client-seed-001';
    const nonce = 1;
    const serverSeedHash = await hashServerSeed(serverSeed);

    for (const game of GAMES) {
      const verified = await verifyRound({
        game,
        serverSeed,
        serverSeedHash,
        clientSeed,
        nonce,
      });
      expect(verified.seedHashMatch).toBe(true);
      expect(verified.floats.length).toBeGreaterThan(0);
    }
  });

  it('recomputeResult matches dice contract selection shape', async () => {
    const serverSeed = 'dice-seed';
    const clientSeed = 'dice-client';
    const nonce = 2;
    const floats = await floatStream(serverSeed, clientSeed, nonce, 1);
    const recomputed = recomputeResult('dice', floats, {
      target: '50.00',
      direction: 'over',
    }) as { roll: number; won: boolean };
    expect(recomputed.roll).toBeGreaterThanOrEqual(0);
    expect(recomputed.roll).toBeLessThanOrEqual(99.99);
    expect(typeof recomputed.won).toBe('boolean');
  });

  it('recomputeResult matches mint_reels lines selection', async () => {
    const serverSeed = 'mint-seed-r07';
    const clientSeed = 'mint-client-r07';
    const nonce = 1;
    const floats = await floatStream(serverSeed, clientSeed, nonce, 5);
    const recomputed = recomputeResult('mint_reels', floats, { lines: 20 }) as {
      totalMultiplier: number;
    };
    expect(recomputed.totalMultiplier).toBeGreaterThanOrEqual(0);
  });

  it('recomputeResult matches gold_rush lines selection', async () => {
    const serverSeed = 'gold-seed-r07';
    const clientSeed = 'gold-client-r07';
    const nonce = 1;
    const floats = await floatStream(serverSeed, clientSeed, nonce, 5);
    const recomputed = recomputeResult('gold_rush', floats, { lines: 1 }) as {
      totalMultiplier: number;
    };
    expect(recomputed.totalMultiplier).toBeGreaterThanOrEqual(0);
  });

  it('recomputeResult matches momentum comboBefore/cashOut selection', async () => {
    const serverSeed = 'momentum-seed-r07';
    const clientSeed = 'momentum-client-r07';
    const nonce = 1;
    const floats = await floatStream(serverSeed, clientSeed, nonce, 1);
    const recomputed = recomputeResult('momentum', floats, {
      comboBefore: 3,
      cashOut: true,
    }) as {
      won: boolean;
      cashedOut: boolean;
      totalMultiplier: number;
    };
    expect(typeof recomputed.won).toBe('boolean');
    expect(typeof recomputed.cashedOut).toBe('boolean');
    expect(recomputed.totalMultiplier).toBeGreaterThanOrEqual(0);
  });

  it('recomputeResult matches crash autoCashout selection', async () => {
    const serverSeed = 'crash-seed-r07';
    const clientSeed = 'crash-client-r07';
    const nonce = 1;
    const floats = await floatStream(serverSeed, clientSeed, nonce, 1);
    const recomputed = recomputeResult('crash', floats, { autoCashout: '2.00' }) as {
      crashMultiplier: number;
      cashedOut: boolean;
      cashoutMultiplier: number;
    };
    expect(recomputed.crashMultiplier).toBeGreaterThanOrEqual(1);
    expect(typeof recomputed.cashedOut).toBe('boolean');
  });

  it('recomputeResult matches limbo target selection', async () => {
    const serverSeed = 'limbo-seed-r07';
    const clientSeed = 'limbo-client-r07';
    const nonce = 1;
    const floats = await floatStream(serverSeed, clientSeed, nonce, 1);
    const recomputed = recomputeResult('limbo', floats, { target: '3.00' }) as {
      resultMultiplier: number;
      won: boolean;
    };
    expect(recomputed.resultMultiplier).toBeGreaterThanOrEqual(1);
    expect(typeof recomputed.won).toBe('boolean');
  });

  it('recomputeResult matches mines mineCount/revealedCells selection', async () => {
    const serverSeed = 'mines-seed-r05';
    const clientSeed = 'mines-client-r05';
    const nonce = 1;
    const selection = { mineCount: 5, revealedCells: [0, 2, 4] };
    const floats = await floatStream(serverSeed, clientSeed, nonce, 25);
    const recomputed = recomputeResult('mines', floats, selection) as {
      minePositions: number[];
      hitMine: boolean;
    };
    expect(recomputed.minePositions).toHaveLength(5);
    expect(typeof recomputed.hitMine).toBe('boolean');
  });

  it('recomputeResult matches plinko rows/risk selection', async () => {
    const serverSeed = 'plinko-seed-r05';
    const clientSeed = 'plinko-client-r05';
    const nonce = 1;
    const selection = { rows: 16, risk: 'medium' as const };
    const floats = await floatStream(serverSeed, clientSeed, nonce, 16);
    const recomputed = recomputeResult('plinko', floats, selection) as {
      path: number[];
      bucket: number;
      bucketMultiplier: string;
    };
    expect(recomputed.path).toHaveLength(16);
    expect(recomputed.bucket).toBeGreaterThanOrEqual(0);
    expect(recomputed.bucket).toBeLessThanOrEqual(16);
  });

  it('recomputeResult matches hilo startCard/guesses selection', async () => {
    const serverSeed = 'hilo-seed-r05';
    const clientSeed = 'hilo-client-r05';
    const nonce = 1;
    const selection = { startCard: 9, guesses: ['higher'] as const };
    const floats = await floatStream(serverSeed, clientSeed, nonce, 11);
    const recomputed = recomputeResult('hilo', floats, selection) as {
      cards: number[];
      rounds: unknown[];
      won: boolean;
    };
    expect(recomputed.cards.length).toBeGreaterThanOrEqual(2);
    expect(recomputed.rounds.length).toBeGreaterThanOrEqual(1);
    expect(recomputed.rounds.length).toBeLessThanOrEqual(selection.guesses.length);
    expect(typeof recomputed.won).toBe('boolean');
  });

  it('recomputeResult matches roulette bets selection', async () => {
    const serverSeed = 'roulette-seed-r04';
    const clientSeed = 'roulette-client-r04';
    const nonce = 1;
    const selection = { bets: [{ type: 'red' as const, value: null, stakeWeight: 1 }] };
    const floats = await floatStream(serverSeed, clientSeed, nonce, 1);
    const recomputed = recomputeResult('roulette', floats, selection) as {
      winningNumber: number;
      totalMultiplier: number;
    };
    expect(recomputed.winningNumber).toBeGreaterThanOrEqual(0);
    expect(recomputed.winningNumber).toBeLessThanOrEqual(36);
    expect(recomputed.totalMultiplier).toBeGreaterThanOrEqual(0);
  });

  it('recomputeResult matches blackjack stand-only selection', async () => {
    const serverSeed = 'blackjack-seed-r04';
    const clientSeed = 'blackjack-client-r04';
    const nonce = 1;
    const selection = { actions: [{ seat: 0, move: 'stand' as const }] };
    const floats = await floatStream(serverSeed, clientSeed, nonce, 51);
    const recomputed = recomputeResult('blackjack', floats, selection) as {
      totalMultiplier: number;
    };
    expect(recomputed.totalMultiplier).toBeGreaterThanOrEqual(0);
    expect(recomputed.totalMultiplier).toBeLessThanOrEqual(2.5);
  });

  it('recomputeResult matches deepshaft riskTier/targetDepth selection', async () => {
    const serverSeed = 'deepshaft-seed-r04';
    const clientSeed = 'deepshaft-client-r04';
    const nonce = 1;
    const selection = { riskTier: 'standard' as const, targetDepth: 5 };
    const floats = await floatStream(serverSeed, clientSeed, nonce, 5);
    const recomputed = recomputeResult('deepshaft', floats, selection) as {
      levels: unknown[];
      caveIn: boolean;
      won: boolean;
      totalMultiplier: number;
    };
    expect(recomputed.levels.length).toBeGreaterThanOrEqual(1);
    expect(recomputed.levels.length).toBeLessThanOrEqual(5);
    expect(typeof recomputed.caveIn).toBe('boolean');
    expect(typeof recomputed.won).toBe('boolean');
  });

  it('rejects tampered seed hash', async () => {
    const verified = await verifyRound({
      game: 'dice',
      serverSeed: 'parity-seed',
      serverSeedHash: '0000000000000000000000000000000000000000000000000000000000000000',
      clientSeed: 'parity-client',
      nonce: 1,
    });
    expect(verified.seedHashMatch).toBe(false);
  });
});
