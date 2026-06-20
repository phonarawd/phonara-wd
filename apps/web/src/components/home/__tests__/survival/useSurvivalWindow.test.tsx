import { describe, it, expect } from "vitest";
import { computeScriptedRank, tierBandFromRank } from "@/hooks/useSurvivalCheckin";

describe("useSurvivalCheckin helpers", () => {
  it("computeScriptedRank is deterministic 8 + (index % 35)", () => {
    expect(computeScriptedRank(0)).toBe(8);
    expect(computeScriptedRank(1)).toBe(9);
    expect(computeScriptedRank(35)).toBe(8);
  });

  it("tierBandFromRank maps §9 bands", () => {
    expect(tierBandFromRank(1)).toBe("gold");
    expect(tierBandFromRank(5)).toBe("silver");
    expect(tierBandFromRank(500)).toBe("bronze");
    expect(tierBandFromRank(1001)).toBe("default");
  });
});

describe("useSurvivalWindow (phase logic via import)", () => {
  it("exports SURVIVAL_WINDOW_DEFAULTS with 07:00-09:00 KST", async () => {
    const mod = await import("@/hooks/useSurvivalWindow");
    expect(mod.SURVIVAL_WINDOW_DEFAULTS.openHour).toBe(7);
    expect(mod.SURVIVAL_WINDOW_DEFAULTS.closeHour).toBe(9);
    expect(mod.SURVIVAL_WINDOW_DEFAULTS.timeZone).toBe("Asia/Seoul");
  });
});
