import { describe, it, expect } from "vitest";
import * as visuals from "../visuals";

describe("visuals (reserved)", () => {
  it("module is importable", () => {
    expect(visuals.VISUALS_PHASE).toBe(1);
  });
});
