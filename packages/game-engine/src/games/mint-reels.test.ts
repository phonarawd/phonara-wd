import { describe, expect, it } from 'vitest';
import { Decimal } from '@phonara/money';
import { floatStream } from '../fairness/float';
import { mintReelsDefinition, MINT_REELS_CONFIG } from './mint-reels';
import { spinSlot, slotPayoutMultiplier } from '../lib/slot-engine';

import './mint-reels';

const SERVER = 'deadbeef00112233445566778899aabbccddeeff00112233445566778899aabb';
const CLIENT = 'mint_reels_red';

describe('mint_reels RED', () => {
  it('rejects invalid line counts', async () => {
    const floats = await floatStream(SERVER, CLIENT, 1, 5);
    expect(() => mintReelsDefinition.resultFromFloats(floats, { lines: 0 })).toThrow(
      'invalid_slot_lines',
    );
    expect(() => mintReelsDefinition.resultFromFloats(floats, { lines: 21 })).toThrow(
      'invalid_slot_lines',
    );
  });

  it('exposure cap scales with active lines', () => {
    expect(mintReelsDefinition.maxPayoutMultiplier?.({ lines: 20 })).toBe(3.75);
    expect(mintReelsDefinition.maxPayoutMultiplier?.({ lines: 1 })).toBe(75);
  });

  it('MC RTP stays below 100% (10k seeds)', async () => {
    const stake = new Decimal('1');
    let total = 0;
    for (let i = 0; i < 10_000; i += 1) {
      const floats = await floatStream(`${SERVER}:${i}`, CLIENT, (i % 251) + 1, 5);
      const spin = spinSlot(MINT_REELS_CONFIG, floats, 20);
      const mult = slotPayoutMultiplier(spin.totalMultiplier, 20);
      const { payout } = mintReelsDefinition.settle(stake, { lines: 20 }, { totalMultiplier: mult });
      total += payout.toNumber();
    }
    expect(total / 10_000).toBeLessThan(1);
    expect(total / 10_000).toBeGreaterThan(0.05);
  });

  it('settle conserves stake = payout + houseEdgeLeg', () => {
    const stake = new Decimal('10');
    const result = { totalMultiplier: 2.5 };
    const { payout, houseEdgeLeg } = mintReelsDefinition.settle(stake, { lines: 20 }, result);
    expect(payout.plus(houseEdgeLeg).eq(stake)).toBe(true);
  });
});
