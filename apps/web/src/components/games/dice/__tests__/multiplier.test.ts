/**
 * Dice · multiplier — engine-parity helper (Phase 5 v1 RED LOCK v3.1).
 *
 * Verifies `diceMultiplier` matches PHONARA `packages/game-engine/src/games/dice.ts`:
 *   prob = direction === 'over' ? (9999 - floor(t*100))/10000 : floor(t*100)/10000
 *   mult = Math.floor(99 / prob) / 100
 *
 * Regression gate: catches `floor((99/prob)*100)/100` drift (v3 오기) → 198.03 vs 1.98.
 */
import { describe, it, expect } from "vitest";
import { diceMultiplier, diceWinProbability } from "../multiplier";

describe("Dice · diceMultiplier (engine 1:1 parity)", () => {
  it("target=50 over → prob≈0.4999, mult≈1.98 (canonical case)", () => {
    expect(diceWinProbability(50, "over")).toBeCloseTo(0.4999, 6);
    expect(diceMultiplier(50, "over")).toBeCloseTo(1.98, 2);
  });

  it("target=50 under → prob=0.5, mult=1.98", () => {
    expect(diceWinProbability(50, "under")).toBeCloseTo(0.5, 6);
    expect(diceMultiplier(50, "under")).toBeCloseTo(1.98, 2);
  });

  it("target=2 over → prob≈0.9799, mult≈1.01 (easy)", () => {
    expect(diceMultiplier(2, "over")).toBeCloseTo(1.01, 2);
  });

  it("target=98 over → prob≈0.0199, mult≈49.74 (hard)", () => {
    expect(diceMultiplier(98, "over")).toBeCloseTo(49.74, 2);
  });

  it("target=99.99 over → prob=0, mult=0 (no-win guard)", () => {
    expect(diceMultiplier(99.99, "over")).toBe(0);
  });

  it("drift sentinel — NOT floor((99/prob)*100)/100 (would give ≈198)", () => {
    expect(diceMultiplier(50, "over")).toBeLessThan(10);
  });
});
