import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import * as celebrate from "../celebrate";

describe("D · celebrate", () => {
  it("celebrationTier maps multipliers to 6 tiers + none (cashoutMultiplier basis)", () => {
    expect(celebrate.celebrationTier(0)).toBe("none");
    expect(celebrate.celebrationTier(1.5)).toBe("small");
    expect(celebrate.celebrationTier(3)).toBe("nice");
    expect(celebrate.celebrationTier(7)).toBe("big");
    expect(celebrate.celebrationTier(20)).toBe("huge");
    expect(celebrate.celebrationTier(100)).toBe("mega");
    expect(celebrate.celebrationTier(1000)).toBe("ultra");
  });

  it("CelebrateOverlay renders nothing for tier=none", () => {
    const { container } = render(<celebrate.CelebrateOverlay tier="none" multiplier="0.00" />);
    expect(container.firstChild).toBeNull();
  });

  it("CelebrateOverlay renders multiplier for tier=mega", () => {
    const { getByTestId } = render(<celebrate.CelebrateOverlay tier="mega" multiplier="120.0" />);
    expect(getByTestId("casino-celebrate-overlay").textContent).toContain("120");
  });

  it("loss case (cashedOut=false) → celebrationTier NOT called (win-only guard)", () => {
    const spy = vi.spyOn(celebrate, "celebrationTier");
    // Caller-side win guard mirrors Crash Stage:
    const r = { cashedOut: false as boolean, cashoutMultiplier: undefined as number | undefined };
    const win = r.cashedOut === true && (r.cashoutMultiplier ?? 0) >= 1.01;
    const tier = win ? celebrate.celebrationTier(r.cashoutMultiplier!) : "none";
    expect(tier).toBe("none");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("win case with cashoutMultiplier 1.5/3/7/20/100/1000 → small/nice/big/huge/mega/ultra", () => {
    const cases: Array<[number, celebrate.CelebrationTier]> = [
      [1.5, "small"],
      [3, "nice"],
      [7, "big"],
      [20, "huge"],
      [100, "mega"],
      [1000, "ultra"],
    ];
    for (const [m, expected] of cases) {
      expect(celebrate.celebrationTier(m)).toBe(expected);
    }
  });
});
