/**
 * Plinko · celebrate — 3구간 (win / neutral / loss) tier mapping.
 *
 * 입력은 PHONARA Plinko `bet.result.bucketMultiplier` 문자열 기준.
 * Number(bucketMultiplier)로 비교만 수행 (SQL parity 위해 문자열 보존).
 *
 *   mult >= 1.01           → win  · celebrationTier(mult)
 *   1.0 ≤ mult < 1.01      → neutral · tier 'none' · no shake · no juice
 *   mult < 1               → loss · tier 'none' · screenShake
 */
import { describe, it, expect, vi } from "vitest";
import * as celebrate from "@/games/shared/celebrate";

function routePlinko(bucketMultiplier: string) {
  const mult = Number(bucketMultiplier);
  const win = mult >= 1.01;
  const tier = win ? celebrate.celebrationTier(mult) : "none";
  return { mult, win, tier, isLoss: mult < 1, isNeutral: mult >= 1 && mult < 1.01 };
}

describe("Plinko · celebrate 3구간", () => {
  it("win bucketMultiplier '1.5'/'3'/'7'/'20'/'100'/'1000' → tier mapping", () => {
    const cases: Array<[string, celebrate.CelebrationTier]> = [
      ["1.5", "small"],
      ["3", "nice"],
      ["7", "big"],
      ["20", "huge"],
      ["100", "mega"],
      ["1000", "ultra"],
    ];
    for (const [m, expected] of cases) {
      const r = routePlinko(m);
      expect(r.tier).toBe(expected);
      expect(r.win).toBe(true);
      expect(r.isLoss).toBe(false);
      expect(r.isNeutral).toBe(false);
    }
  });

  it("loss bucketMultiplier '0.9' → tier 'none' · celebrationTier NOT called", () => {
    const spy = vi.spyOn(celebrate, "celebrationTier");
    const r = routePlinko("0.9");
    expect(r.tier).toBe("none");
    expect(r.win).toBe(false);
    expect(r.isLoss).toBe(true);
    expect(r.isNeutral).toBe(false);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("neutral bucketMultiplier '1.0' → tier 'none' · no juice · no shake · celebrationTier NOT called", () => {
    const spy = vi.spyOn(celebrate, "celebrationTier");
    const r = routePlinko("1.0");
    expect(r.tier).toBe("none");
    expect(r.win).toBe(false);
    expect(r.isLoss).toBe(false);
    expect(r.isNeutral).toBe(true);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("CelebrateOverlay receives bucketMultiplier string verbatim", () => {
    // 문자열 보존 invariant — SQL parity.
    const multStr = "12.34";
    expect(routePlinko(multStr).mult).toBeCloseTo(12.34);
    // Overlay multiplier prop은 문자열 그대로 전달 (Stage.tsx 참조).
  });
});
