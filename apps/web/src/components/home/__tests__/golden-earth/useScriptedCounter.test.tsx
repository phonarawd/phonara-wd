import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useScriptedCounter, GOLDEN_EARTH_DEFAULTS } from "@/hooks/useScriptedCounter";

vi.mock("@/hooks/useLiveCount", () => ({
  useLiveCount: (seed: number) => seed,
}));

describe("useScriptedCounter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts at seed and bumps by 1", () => {
    const { result } = renderHook(() => useScriptedCounter());

    expect(result.current.globalCount).toBe(GOLDEN_EARTH_DEFAULTS.seed);

    act(() => {
      result.current.bump();
    });

    expect(result.current.globalCount).toBe(GOLDEN_EARTH_DEFAULTS.seed + 1);
    expect(result.current.bumpTick).toBe(1);
  });

  it("computes remaining to milestone", () => {
    const { result } = renderHook(() =>
      useScriptedCounter({ seed: 9_950_000, milestone: 10_000_000 }),
    );

    expect(result.current.remainingToMilestone).toBe(50_000);
  });

  it("is urgent at urgency threshold", () => {
    const { result } = renderHook(() =>
      useScriptedCounter({
        seed: GOLDEN_EARTH_DEFAULTS.urgencyThreshold,
        urgencyThreshold: GOLDEN_EARTH_DEFAULTS.urgencyThreshold,
      }),
    );

    expect(result.current.isUrgent).toBe(true);
  });
});
