/**
 * Mines · celebrate — feel 2지 (win / loss) tier mapping synced with
 * Stage.tsx routing.
 *
 * Engine: PHONARA `packages/game-engine/src/games/mines.ts` returns
 *   { minePositions: number[]; hitMine: boolean }
 *
 * Stage routes:
 *   !hitMine && revealedCells.length > 0 && mult >= 1.01 → win · tier(mult)
 *   hitMine                                              → loss · screenShake
 *   !hitMine && revealedCells.length == 0                → idle (no settle)
 *
 * Mines는 cashout 시 mult >= 1.01이 보통(1 reveal도 ≥1.01) — Limbo와
 * 동일한 임계 사용.
 */
import { describe, it, expect, vi } from "vitest";
import * as celebrate from "@/games/shared/celebrate";
import { minesPreviewMultiplier } from "../multiplier";

type Result = { minePositions: number[]; hitMine: boolean };

function routeMines(r: Result, revealed: number[], mineCount: number) {
  const settled = true;
  const hitMine = r.hitMine === true;
  const safeReveal = !hitMine && revealed.length > 0;
  const mult = Number(minesPreviewMultiplier(revealed.length, mineCount));
  const tier =
    settled && safeReveal && mult >= 1.01 ? celebrate.celebrationTier(mult) : "none";
  return { hitMine, safeReveal, mult, tier };
}

describe("Mines · celebrate feel 2지", () => {
  it("safe cashout { minePositions:[5,12], hitMine:false } revealed=[0,1,2] mines=3 → tier set · win", () => {
    const r = routeMines({ minePositions: [5, 12], hitMine: false }, [0, 1, 2], 3);
    expect(r.hitMine).toBe(false);
    expect(r.safeReveal).toBe(true);
    expect(r.mult).toBeGreaterThanOrEqual(1.01);
    expect(r.tier).not.toBe("none");
  });

  it("loss { minePositions:[0,5], hitMine:true } revealed=[0] → tier 'none' · celebrationTier NOT called", () => {
    const spy = vi.spyOn(celebrate, "celebrationTier");
    const r = routeMines({ minePositions: [0, 5], hitMine: true }, [0], 3);
    expect(r.hitMine).toBe(true);
    expect(r.safeReveal).toBe(false);
    expect(r.tier).toBe("none");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("idle settle-no-reveal { minePositions:[1], hitMine:false } revealed=[] → tier 'none'", () => {
    const r = routeMines({ minePositions: [1], hitMine: false }, [], 3);
    expect(r.safeReveal).toBe(false);
    expect(r.tier).toBe("none");
  });

  it("tier mapping at various reveal counts (mineCount=3) ≥1.01", () => {
    for (const n of [1, 3, 5, 10]) {
      const revealed = Array.from({ length: n }, (_, i) => i);
      const r = routeMines({ minePositions: [20, 21, 22], hitMine: false }, revealed, 3);
      expect(r.mult).toBeGreaterThanOrEqual(1.01);
      expect(r.tier).not.toBe("none");
    }
  });
});
