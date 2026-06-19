/**
 * Momentum · FIXTURES — pure data literals (LAW 1).
 *
 * The Momentum ENGINE is FINAL in Cursor; these hand-written objects
 * are decorative replay used ONLY by the in-canvas Lovable preview.
 * NO computation: no arithmetic, no comparisons, no derivation of
 * result fields. Each value is a literal that mirrors what the real
 * engine will emit verbatim.
 *
 * Tested by __tests__/mock-is-fixtures.test.ts (LAW 1 proof).
 */
import type { MomentumResult } from "./types";

/** Fixture key naming convention: `play-win-from-N`, `play-loss`,
 *  `cashout-at-N`. Lookup is a plain Record access — no algorithm. */
export type MomentumFixtureKey =
  | "play-win-from-0"
  | "play-win-from-1"
  | "play-win-from-2"
  | "play-win-from-3"
  | "play-win-from-4"
  | "play-win-from-5"
  | "play-win-from-6"
  | "play-win-from-7"
  | "play-win-from-8"
  | "play-win-from-9"
  | "play-loss"
  | "cashout-at-0"
  | "cashout-at-1"
  | "cashout-at-2"
  | "cashout-at-3"
  | "cashout-at-4"
  | "cashout-at-5"
  | "cashout-at-6"
  | "cashout-at-7"
  | "cashout-at-8"
  | "cashout-at-9"
  | "cashout-at-10";

export const MOMENTUM_FIXTURES: Record<MomentumFixtureKey, MomentumResult> = {
  "play-win-from-0": { comboAfter: 1, comboMultiplier: "1.50", won: true, cashedOut: false, roll: 67.42 },
  "play-win-from-1": { comboAfter: 2, comboMultiplier: "2.25", won: true, cashedOut: false, roll: 71.08 },
  "play-win-from-2": { comboAfter: 3, comboMultiplier: "3.37", won: true, cashedOut: false, roll: 83.55 },
  "play-win-from-3": { comboAfter: 4, comboMultiplier: "5.06", won: true, cashedOut: false, roll: 58.91 },
  "play-win-from-4": { comboAfter: 5, comboMultiplier: "7.59", won: true, cashedOut: false, roll: 76.24 },
  "play-win-from-5": { comboAfter: 6, comboMultiplier: "11.39", won: true, cashedOut: false, roll: 88.17 },
  "play-win-from-6": { comboAfter: 7, comboMultiplier: "17.08", won: true, cashedOut: false, roll: 62.30 },
  "play-win-from-7": { comboAfter: 8, comboMultiplier: "25.62", won: true, cashedOut: false, roll: 94.86 },
  "play-win-from-8": { comboAfter: 9, comboMultiplier: "38.44", won: true, cashedOut: false, roll: 55.71 },
  "play-win-from-9": { comboAfter: 10, comboMultiplier: "57.66", won: true, cashedOut: false, roll: 79.03 },
  "play-loss": { comboAfter: 0, comboMultiplier: "1.00", won: false, cashedOut: false, roll: 31.08 },
  "cashout-at-0": { comboAfter: 0, comboMultiplier: "1.00", totalMultiplier: "1.00", won: true, cashedOut: true, roll: 0 },
  "cashout-at-1": { comboAfter: 0, comboMultiplier: "1.50", totalMultiplier: "1.50", won: true, cashedOut: true, roll: 0 },
  "cashout-at-2": { comboAfter: 0, comboMultiplier: "2.25", totalMultiplier: "2.25", won: true, cashedOut: true, roll: 0 },
  "cashout-at-3": { comboAfter: 0, comboMultiplier: "3.37", totalMultiplier: "3.37", won: true, cashedOut: true, roll: 0 },
  "cashout-at-4": { comboAfter: 0, comboMultiplier: "5.06", totalMultiplier: "5.06", won: true, cashedOut: true, roll: 0 },
  "cashout-at-5": { comboAfter: 0, comboMultiplier: "7.59", totalMultiplier: "7.59", won: true, cashedOut: true, roll: 0 },
  "cashout-at-6": { comboAfter: 0, comboMultiplier: "11.39", totalMultiplier: "11.39", won: true, cashedOut: true, roll: 0 },
  "cashout-at-7": { comboAfter: 0, comboMultiplier: "17.08", totalMultiplier: "17.08", won: true, cashedOut: true, roll: 0 },
  "cashout-at-8": { comboAfter: 0, comboMultiplier: "25.62", totalMultiplier: "25.62", won: true, cashedOut: true, roll: 0 },
  "cashout-at-9": { comboAfter: 0, comboMultiplier: "38.44", totalMultiplier: "38.44", won: true, cashedOut: true, roll: 0 },
  "cashout-at-10": { comboAfter: 0, comboMultiplier: "57.66", totalMultiplier: "57.66", won: true, cashedOut: true, roll: 0 },
};
