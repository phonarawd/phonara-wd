import { describe, it, expect } from "vitest";
import { createActivityEngine } from "../activityEngine";

describe("mixWithReal", () => {
  const e = createActivityEngine({ seed: 1, now: () => new Date(0) });

  it("real entries appear first (precedence)", () => {
    const real = [{ id: "real-1" }, { id: "real-2" }];
    const syn = [{ id: "syn-1" }, { id: "syn-2" }];
    const out = e.mixWithReal(real, syn);
    expect(out[0]).toEqual({ id: "real-1" });
    expect(out[1]).toEqual({ id: "real-2" });
    expect(out.length).toBe(4);
  });

  it("empty real → all synthetic returned", () => {
    const syn = [{ id: "s1" }, { id: "s2" }];
    expect(e.mixWithReal([], syn)).toEqual(syn);
  });

  it("empty synthetic → only real returned", () => {
    const real = [{ id: "r1" }];
    expect(e.mixWithReal(real, [])).toEqual(real);
  });
});
