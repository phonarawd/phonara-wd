import { z } from 'zod';
import { registerGame, type GameDefinition } from '../registry';
import { quantize6 } from '../lib/quantize';
import {
  PAYLINES_20,
  slotPayoutMultiplier,
  spinSlot,
  type SlotConfig,
} from '../lib/slot-engine';

export interface MintReelsSelection {
  lines: number;
}

export interface MintReelsResult {
  totalMultiplier: number;
}

/** Shared paytable — mint theme (exported for SQL parity constants). */
export const MINT_REELS_PAYTABLE: Readonly<Record<number, readonly [number, number, number]>> = {
  0: [1, 2, 5],
  1: [1, 3, 6],
  2: [2, 4, 8],
  3: [2, 5, 10],
  4: [3, 8, 15],
  5: [4, 10, 25],
  6: [10, 30, 75],
};

export const MINT_REELS_REELS: readonly (readonly number[])[] = [
  [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 0, 1, 2, 3, 4, 5, 7],
  [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 0, 1, 2, 3, 4, 5, 6, 7],
  [0, 0, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 1, 2, 3, 4, 5, 6, 0, 7],
  [0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6, 0, 1, 2, 3, 4, 5, 6, 2, 7],
  [0, 0, 1, 1, 2, 3, 3, 4, 5, 5, 6, 0, 1, 2, 3, 4, 5, 6, 4, 7],
];

export const MINT_REELS_CONFIG: SlotConfig = {
  reels: MINT_REELS_REELS,
  paytable: MINT_REELS_PAYTABLE,
  maxJackpotMultiplier: 75,
};

const mintReelsDefinition: GameDefinition<MintReelsSelection, MintReelsResult> = {
  code: 'mint_reels',
  betSchema: z.object({
    lines: z.number().int().min(1).max(PAYLINES_20.length),
  }),
  floatCount: 5,

  resultFromFloats(floats, selection): MintReelsResult {
    const spin = spinSlot(MINT_REELS_CONFIG, floats, selection.lines);
    return {
      totalMultiplier: slotPayoutMultiplier(spin.totalMultiplier, selection.lines),
    };
  },

  settle(stake, selection, result) {
    const payout = stake.mul(quantize6(result.totalMultiplier.toFixed(6)));
    return { payout, houseEdgeLeg: stake.minus(payout) };
  },

  maxPayoutMultiplier(selection) {
    return MINT_REELS_CONFIG.maxJackpotMultiplier / selection.lines;
  },
};

registerGame(mintReelsDefinition);
export { mintReelsDefinition };
