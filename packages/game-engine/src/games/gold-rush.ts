import { z } from 'zod';
import { registerGame, type GameDefinition } from '../registry';
import { quantize6 } from '../lib/quantize';
import {
  PAYLINES_20,
  slotPayoutMultiplier,
  spinSlot,
  type SlotConfig,
} from '../lib/slot-engine';

export interface GoldRushSelection {
  lines: number;
}

export interface GoldRushResult {
  totalMultiplier: number;
}

/** Gold Rush paytable — higher variance, distinct from mint_reels. */
export const GOLD_RUSH_PAYTABLE: Readonly<Record<number, readonly [number, number, number]>> = {
  0: [1, 2, 4],
  1: [1, 3, 5],
  2: [2, 4, 7],
  3: [2, 5, 9],
  4: [3, 7, 14],
  5: [4, 9, 20],
  6: [12, 35, 80],
};

export const GOLD_RUSH_REELS: readonly (readonly number[])[] = [
  [0, 0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 0, 1, 2, 3, 4, 5, 6, 7],
  [0, 1, 1, 2, 2, 3, 3, 4, 5, 5, 6, 0, 1, 2, 3, 4, 5, 6, 0, 7],
  [0, 0, 1, 2, 2, 3, 4, 4, 5, 5, 6, 1, 2, 3, 4, 5, 6, 0, 1, 7],
  [0, 1, 2, 2, 3, 3, 4, 5, 5, 6, 0, 1, 2, 3, 4, 5, 6, 0, 1, 7],
  [0, 0, 1, 1, 2, 3, 3, 4, 5, 6, 0, 1, 2, 3, 4, 5, 6, 2, 3, 7],
];

export const GOLD_RUSH_CONFIG: SlotConfig = {
  reels: GOLD_RUSH_REELS,
  paytable: GOLD_RUSH_PAYTABLE,
  maxJackpotMultiplier: 80,
};

const goldRushDefinition: GameDefinition<GoldRushSelection, GoldRushResult> = {
  code: 'gold_rush',
  betSchema: z.object({
    lines: z.number().int().min(1).max(PAYLINES_20.length),
  }),
  floatCount: 5,

  resultFromFloats(floats, selection): GoldRushResult {
    const spin = spinSlot(GOLD_RUSH_CONFIG, floats, selection.lines);
    return {
      totalMultiplier: slotPayoutMultiplier(spin.totalMultiplier, selection.lines),
    };
  },

  settle(stake, selection, result) {
    const payout = stake.mul(quantize6(result.totalMultiplier.toFixed(6)));
    return { payout, houseEdgeLeg: stake.minus(payout) };
  },

  maxPayoutMultiplier(selection) {
    return GOLD_RUSH_CONFIG.maxJackpotMultiplier / selection.lines;
  },
};

registerGame(goldRushDefinition);
export { goldRushDefinition };
