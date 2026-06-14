import { describe, expect, it } from 'vitest';
import { Decimal } from '@phonara/money';
import { floatStream } from '../fairness/float';
import {
  evaluateRoulette,
  rouletteDefinition,
  rouletteMaxExposureMultiplier,
  rouletteWinningNumber,
} from './roulette';

import './roulette';

const SERVER = 'deadbeef00112233445566778899aabbccddeeff00112233445566778899aabb';
const CLIENT = 'roulette_red';

describe('roulette RED (casino — not Earn rpc_spin_roulette)', () => {
  it('winning number is 0..36', async () => {
    const floats = await floatStream(SERVER, CLIENT, 1, 1);
    const n = rouletteWinningNumber(floats);
    expect(n).toBeGreaterThanOrEqual(0);
    expect(n).toBeLessThanOrEqual(36);
  });

  it('rejects empty bet legs', () => {
    expect(() => evaluateRoulette({ bets: [] }, 17)).toThrow('invalid_roulette_bets');
  });

  it('leg exposure sums weighted max multipliers', () => {
    const mult = rouletteMaxExposureMultiplier({
      bets: [
        { type: 'straight', value: 7, stakeWeight: 1 },
        { type: 'red', value: null, stakeWeight: 1 },
      ],
    });
    expect(mult).toBeCloseTo((36 + 2) / 2, 5);
  });

  it('theoretical RTP is 36/37 (single-zero)', () => {
    expect(rouletteDefinition.theoreticalRtp?.().toNumber()).toBeCloseTo(36 / 37, 4);
  });

  it('settle conserves stake = payout + houseEdgeLeg', () => {
    const stake = new Decimal('10');
    const { payout, houseEdgeLeg } = rouletteDefinition.settle(
      stake,
      { bets: [{ type: 'red', value: null, stakeWeight: 1 }] },
      { winningNumber: 32, totalMultiplier: 2 },
    );
    expect(payout.plus(houseEdgeLeg).eq(stake)).toBe(true);
  });
});
