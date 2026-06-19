/**
 * Limbo · celebrate — 3구간 (win / loss / neutral) tier mapping
 * synced with Stage.tsx routing.
 *
 * Engine: PHONARA `packages/game-engine/src/games/limbo.ts` returns
 *   { resultMultiplier: number; won: boolean }
 * with `resultMultiplier ≥ 1.0` always (Math.max(1, raw)). The Stage
 * routes:
 *
 *   won && final >= 1.01     → win  · celebrationTier(final)
 *   !won && final >= 1.01    → loss · screenShake (고배수 미스)
 *   !won && 1.0 ≤ final<1.01 → neutral · tier 'none' · no shake
 *   final < 1                → 엔진 불가 (mock 방어용 tier 'none')
 */
import { describe, it, expect, vi } from "vitest";
import * as celebrate from "@/games/shared/celebrate";

type Result = { resultMultiplier: number; won: boolean };

function routeLimbo(r: Result) {
  const final = Number(r.resultMultiplier);
  const won = r.won === true;
  const isWin = won && final >= 1.01;
  const tier = isWin ? celebrate.celebrationTier(final) : "none";
  const isLossMiss = !won && final >= 1.01;
  const isNeutral = !won && final >= 1.0 && final < 1.01;
  const isEngineImpossible = final < 1;
  return { final, won, isWin, tier, isLossMiss, isNeutral, isEngineImpossible };
}

describe("Limbo · celebrate 3구간", () => {
  it("win resultMultiplier 1.5/3/7/20/50/250 → tier mapping (won=true)", () => {
    const cases: Array<[number, celebrate.CelebrationTier]> = [
      [1.5, "small"],
      [3, "nice"],
      [7, "big"],
      [20, "huge"],
      [50, "mega"],
      [250, "ultra"],
    ];
    for (const [m, expected] of cases) {
      const r = routeLimbo({ resultMultiplier: m, won: true });
      expect(r.tier).toBe(expected);
      expect(r.isWin).toBe(true);
      expect(r.isLossMiss).toBe(false);
      expect(r.isNeutral).toBe(false);
    }
  });

  it("realistic loss { 2.5, won:false } → tier 'none' · screenShake path · celebrationTier NOT called", () => {
    const spy = vi.spyOn(celebrate, "celebrationTier");
    const r = routeLimbo({ resultMultiplier: 2.5, won: false });
    expect(r.tier).toBe("none");
    expect(r.isWin).toBe(false);
    expect(r.isLossMiss).toBe(true);
    expect(r.isNeutral).toBe(false);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("neutral { 1.0, won:false } → tier 'none' · no juice · no shake · celebrationTier NOT called", () => {
    const spy = vi.spyOn(celebrate, "celebrationTier");
    const r = routeLimbo({ resultMultiplier: 1.0, won: false });
    expect(r.tier).toBe("none");
    expect(r.isWin).toBe(false);
    expect(r.isLossMiss).toBe(false);
    expect(r.isNeutral).toBe(true);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("mock defense { 0.9, won:false } → engine-impossible · tier 'none'", () => {
    const spy = vi.spyOn(celebrate, "celebrationTier");
    const r = routeLimbo({ resultMultiplier: 0.9, won: false });
    expect(r.tier).toBe("none");
    expect(r.isEngineImpossible).toBe(true);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("sanity: server-inconsistent { 5.0, won:false } → tier 'none' (won gate wins)", () => {
    // If the server ever reports !won with final ≥ 1.01, the UI must NOT
    // celebrate — won is authoritative.
    const r = routeLimbo({ resultMultiplier: 5.0, won: false });
    expect(r.tier).toBe("none");
    expect(r.isWin).toBe(false);
  });
});
