import { describe, expect, it } from 'vitest';
import { Decimal } from '@phonara/money';
import { floatStream } from '../fairness/float';
import { goldRushDefinition, GOLD_RUSH_CONFIG } from './gold-rush';
import { MINT_REELS_CONFIG, mintReelsDefinition } from './mint-reels';
import { spinSlot, slotPayoutMultiplier } from '../lib/slot-engine';

import './gold-rush';

const SERVER = 'deadbeef00112233445566778899aabbccddeeff00112233445566778899aabb';
const CLIENT = 'gold_rush_red';

describe('gold_rush RED', () => {
  it('uses distinct paytable from mint_reels', () => {
    expect(GOLD_RUSH_CONFIG.maxJackpotMultiplier).not.toBe(MINT_REELS_CONFIG.maxJackpotMultiplier);
    expect(GOLD_RUSH_CONFIG.paytable[6]?.[2]).not.toBe(MINT_REELS_CONFIG.paytable[6]?.[2]);
  });

  it('rejects invalid line counts', async () => {
    const floats = await floatStream(SERVER, CLIENT, 1, 5);
    expect(() => goldRushDefinition.resultFromFloats(floats, { lines: 0 })).toThrow(
      'invalid_slot_lines',
    );
  });

  it('MC RTP differs from mint_reels (10k seeds)', async () => {
    const stake = new Decimal('1');
    let goldTotal = 0;
    let mintTotal = 0;
    for (let i = 0; i < 10_000; i += 1) {
      const floats = await floatStream(`${SERVER}:${i}`, CLIENT, (i % 251) + 1, 5);
      const goldSpin = spinSlot(GOLD_RUSH_CONFIG, floats, 20);
      const mintSpin = spinSlot(MINT_REELS_CONFIG, floats, 20);
      goldTotal += goldRushDefinition
        .settle(stake, { lines: 20 }, {
          totalMultiplier: slotPayoutMultiplier(goldSpin.totalMultiplier, 20),
        })
        .payout.toNumber();
      mintTotal += mintReelsDefinition
        .settle(stake, { lines: 20 }, {
          totalMultiplier: slotPayoutMultiplier(mintSpin.totalMultiplier, 20),
        })
        .payout.toNumber();
    }
    expect(goldTotal / 10_000).toBeLessThan(1);
    expect(Math.abs(goldTotal - mintTotal) / 10_000).toBeGreaterThan(0.001);
  });

  it('settle conserves stake = payout + houseEdgeLeg', () => {
    const stake = new Decimal('10');
    const { payout, houseEdgeLeg } = goldRushDefinition.settle(
      stake,
      { lines: 10 },
      { totalMultiplier: 0 },
    );
    expect(payout.plus(houseEdgeLeg).eq(stake)).toBe(true);
  });
});
