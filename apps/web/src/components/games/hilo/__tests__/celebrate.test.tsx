/**
 * HiLo · celebrate — feel 2지 (win / loss) tier mapping synced with
 * Stage.tsx routing.
 *
 * Engine 정본 (PHONARA `packages/game-engine/src/games/hilo.ts`):
 *   {
 *     cards: number[];
 *     rounds: Array<{ card:number; guess:'higher'|'lower'|'skip'; correct:boolean; multiplier:number }>;
 *     won: boolean;
 *   }
 *
 * Stage routes:
 *   won && lastMult >= 1.01 → win  · tier(lastMult)
 *   won === false           → loss · screenShake
 *   rounds.length === 0     → idle (no overlay)
 *
 * **금지**: top-level `resultMultiplier` 또는 `multiplier` 키. tier 진실은
 * `result.rounds[rounds.length - 1].multiplier`.
 */
import { describe, it, expect, vi } from "vitest";
import * as celebrate from "@/games/shared/celebrate";
import type { HiLoResult } from "@/games/shared/types";

function routeHilo(r: HiLoResult) {
  const settled = true;
  const lastMult = r.rounds[r.rounds.length - 1]?.multiplier ?? 1;
  const won = r.won === true;
  const isIdle = (r.rounds?.length ?? 0) === 0;
  const isWin = !isIdle && won && Number(lastMult) >= 1.01;
  const tier = settled && isWin ? celebrate.celebrationTier(Number(lastMult)) : "none";
  const isLoss = !isIdle && !won;
  return { lastMult, won, isWin, isLoss, isIdle, tier };
}

describe("HiLo · celebrate feel 2지", () => {
  it("win { rounds:[{multiplier:3}], won:true } → tier='nice' · isWin", () => {
    const r = routeHilo({
      cards: [10, 22, 5],
      rounds: [
        { card: 10, guess: "higher", correct: true, multiplier: 1.5 },
        { card: 22, guess: "higher", correct: true, multiplier: 2.0 },
        { card: 5, guess: "lower", correct: true, multiplier: 3.0 },
      ],
      won: true,
    });
    expect(r.isWin).toBe(true);
    expect(r.tier).toBe("nice");
  });

  it("loss { rounds:[{multiplier:1.1,correct:false}], won:false } → tier 'none' · screenShake path · celebrationTier NOT called", () => {
    const spy = vi.spyOn(celebrate, "celebrationTier");
    const r = routeHilo({
      cards: [3],
      rounds: [{ card: 3, guess: "higher", correct: false, multiplier: 1.1 }],
      won: false,
    });
    expect(r.isLoss).toBe(true);
    expect(r.isWin).toBe(false);
    expect(r.tier).toBe("none");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("idle settle { rounds:[], won:false } → tier 'none'", () => {
    const r = routeHilo({ cards: [], rounds: [], won: false });
    expect(r.isIdle).toBe(true);
    expect(r.tier).toBe("none");
  });

  it("tier mapping lastMult 1.5/3/7/20/50/250 → small/nice/big/huge/mega/ultra", () => {
    const cases: Array<[number, celebrate.CelebrationTier]> = [
      [1.5, "small"],
      [3, "nice"],
      [7, "big"],
      [20, "huge"],
      [50, "mega"],
      [250, "ultra"],
    ];
    for (const [m, expected] of cases) {
      const r = routeHilo({
        cards: [0],
        rounds: [{ card: 0, guess: "higher", correct: true, multiplier: m }],
        won: true,
      });
      expect(r.tier).toBe(expected);
    }
  });

  it("sanity: server-inconsistent { lastMult:5, won:false } → tier 'none' (won gate wins)", () => {
    const r = routeHilo({
      cards: [0],
      rounds: [{ card: 0, guess: "higher", correct: false, multiplier: 5 }],
      won: false,
    });
    expect(r.tier).toBe("none");
    expect(r.isWin).toBe(false);
  });
});
