import { describe, expect, it } from 'vitest';
import { Decimal } from '@phonara/money';
import { floatStream } from '../fairness/float';
import { assertMcRtpSmoke } from '../lib/mc-rtp-harness';
import {
  completeProbability,
  deepshaftDefinition,
  deepshaftPayoutMultiplier,
  evaluateDeepshaft,
  levelGrowthMult,
  DEEPSHAFT_MAX_DEPTH,
} from './deepshaft';

import './deepshaft';

const SERVER = 'deadbeef00112233445566778899aabbccddeeff00112233445566778899aabb';
const CLIENT = 'deepshaft_client';

const DEPTHS = [5, 8, 12, 15] as const;
const TIERS = ['safe', 'standard', 'deep'] as const;

const DEPTH_15_FLOORS: Record<(typeof TIERS)[number], number> = {
  safe: 0.08,
  standard: 0.02,
  deep: 0.005,
};

/** Representative corners — avoid ultra-low-prob tiers (high MC variance). */
const MC_SMOKE_CASES = [
  { riskTier: 'standard' as const, targetDepth: 5 },
  { riskTier: 'standard' as const, targetDepth: 15 },
  { riskTier: 'safe' as const, targetDepth: 8 },
];

const MC_SMOKE_SEEDS = 400;

describe('deepshaft', () => {
  it('rejects invalid depth', async () => {
    const floats = await floatStream(SERVER, CLIENT, 1, DEEPSHAFT_MAX_DEPTH);
    expect(() =>
      deepshaftDefinition.resultFromFloats(floats, { riskTier: 'standard', targetDepth: 0 }),
    ).toThrow('invalid_deepshaft_depth');
    expect(() =>
      deepshaftDefinition.resultFromFloats(floats, { riskTier: 'standard', targetDepth: 16 }),
    ).toThrow('invalid_deepshaft_depth');
  });

  it('rejects invalid riskTier via Zod', () => {
    const parsed = deepshaftDefinition.betSchema.safeParse({
      riskTier: 'reckless',
      targetDepth: 5,
    });
    expect(parsed.success).toBe(false);
  });

  it('levels[] invariants on full clear', async () => {
    const floats = Array.from({ length: DEEPSHAFT_MAX_DEPTH }, () => 0.99);
    const result = evaluateDeepshaft(floats, { riskTier: 'safe', targetDepth: 5 });
    expect(result.caveIn).toBe(false);
    expect(result.won).toBe(true);
    expect(result.levels).toHaveLength(5);
    expect(result.levels.every((l) => l.outcome === 'gold')).toBe(true);
    expect(result.levels.map((l) => l.depth)).toEqual([1, 2, 3, 4, 5]);
    expect(result.totalMultiplier).toBe(deepshaftPayoutMultiplier('safe', 5));
  });

  it('stops on cave-in and exposes cave-in row', () => {
    const floats = [0.0, 0.99, 0.99];
    const result = evaluateDeepshaft(floats, { riskTier: 'safe', targetDepth: 3 });
    expect(result.caveIn).toBe(true);
    expect(result.won).toBe(false);
    expect(result.totalMultiplier).toBe(0);
    expect(result.levels.at(-1)?.outcome).toBe('cavein');
    expect(result.reachedDepth).toBe(0);
  });

  it('levelGrowthMult rises super-linearly by depth', () => {
    const m1 = levelGrowthMult('standard', 1);
    const m5 = levelGrowthMult('standard', 5);
    const m10 = levelGrowthMult('standard', 10);
    expect(m5).toBeGreaterThan(m1);
    expect(m10).toBeGreaterThan(m5);
    expect(m10 / m1).toBeGreaterThan(10 / 1);
  });

  describe('reachability grid', () => {
    for (const riskTier of TIERS) {
      for (const targetDepth of DEPTHS) {
        it(`completeProbability ${riskTier} depth ${targetDepth}`, () => {
          const p = completeProbability(riskTier, targetDepth);
          expect(p).toBeGreaterThanOrEqual(0.001);
          if (targetDepth === 15) {
            expect(p).toBeGreaterThanOrEqual(DEPTH_15_FLOORS[riskTier]);
          }
        });
      }
    }
  });

  describe('theoretical RTP grid', () => {
    for (const riskTier of TIERS) {
      for (const targetDepth of DEPTHS) {
        it(`RTP ${riskTier} depth ${targetDepth}`, () => {
          const rtp = deepshaftDefinition.theoreticalRtp!({
            riskTier,
            targetDepth,
          }).toNumber();
          expect(rtp).toBeGreaterThanOrEqual(0.985);
          expect(rtp).toBeLessThanOrEqual(0.995);
        });
      }
    }
  });

  it('MC RTP smoke (400 seeds × 3 corners, Hoeffding band)', async () => {
    const stake = new Decimal('1');
    for (const { riskTier, targetDepth } of MC_SMOKE_CASES) {
      let total = 0;
      for (let i = 0; i < MC_SMOKE_SEEDS; i += 1) {
        const floats = await floatStream(
          `${SERVER}:smoke:${i}`,
          `${CLIENT}:${riskTier}:${targetDepth}`,
          (i % 251) + 1,
          15,
        );
        const result = deepshaftDefinition.resultFromFloats(floats, { riskTier, targetDepth });
        const { payout } = deepshaftDefinition.settle(stake, { riskTier, targetDepth }, result);
        total += payout.toNumber();
      }
      const measured = total / MC_SMOKE_SEEDS;
      const theoretical = deepshaftDefinition.theoreticalRtp!({ riskTier, targetDepth }).toNumber();
      assertMcRtpSmoke(measured, theoretical, MC_SMOKE_SEEDS, `${riskTier} d${targetDepth}`);
    }
  }, 60_000);

  it('settle conserves stake = payout + houseEdgeLeg', () => {
    const stake = new Decimal('10');
    const selection = { riskTier: 'standard' as const, targetDepth: 8 };
    const floats = Array.from({ length: 15 }, () => 0.99);
    const result = evaluateDeepshaft(floats, selection);
    const { payout, houseEdgeLeg } = deepshaftDefinition.settle(stake, selection, result);
    expect(payout.plus(houseEdgeLeg).eq(stake)).toBe(true);
  });
});
