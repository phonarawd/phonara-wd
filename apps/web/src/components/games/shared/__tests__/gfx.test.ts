import { describe, it, expect } from "vitest";
import * as gfx from "../gfx";

describe("A · gfx", () => {
  it("exports filters and useGPUTier", () => {
    expect(typeof gfx.useGPUTier).toBe("function");
    expect(gfx.neonGlow()).toMatch(/drop-shadow/);
    expect(gfx.scanlines()).toMatch(/repeating-linear-gradient/);
    expect(gfx.vignette()).toMatch(/radial-gradient/);
  });
});
