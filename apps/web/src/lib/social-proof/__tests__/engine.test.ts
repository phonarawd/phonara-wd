import { describe, it, expect } from "vitest";
import { createActivityEngine, __internals } from "../activityEngine";

describe("activityEngine determinism", () => {
  it("same seed → identical output", () => {
    const a = createActivityEngine({ seed: 42, now: () => new Date(0) });
    const b = createActivityEngine({ seed: 42, now: () => new Date(0) });
    expect(a.getLiveBets(5)).toEqual(b.getLiveBets(5));
    expect(a.getRecentPayouts(5)).toEqual(b.getRecentPayouts(5));
  });

  it("different seed → different output", () => {
    const a = createActivityEngine({ seed: 1, now: () => new Date(0) });
    const b = createActivityEngine({ seed: 2, now: () => new Date(0) });
    expect(a.getLiveBets(3)).not.toEqual(b.getLiveBets(3));
  });

  it("every node carries synthetic: true", () => {
    const e = createActivityEngine({ seed: 7, now: () => new Date(0) });
    for (const b of e.getLiveBets(10)) expect(b.synthetic).toBe(true);
    for (const p of e.getRecentPayouts(10)) expect(p.synthetic).toBe(true);
  });
});

describe("KST online curve", () => {
  it("06:00 < 22:00", () => {
    expect(__internals.onlineForKstHour(6)).toBeLessThan(
      __internals.onlineForKstHour(22),
    );
  });
  it("peak around 22:00 ≈ 18k, trough near 04:00 ≈ 3-4k", () => {
    expect(__internals.onlineForKstHour(22)).toBeGreaterThan(15000);
    expect(__internals.onlineForKstHour(4)).toBeLessThan(5000);
  });
});
