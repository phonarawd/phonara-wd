import { describe, it, expect } from "vitest";
import * as feel from "../feel";

describe("B · feel", () => {
  it("exports screenShake / hitStop / juice", () => {
    expect(typeof feel.screenShake).toBe("function");
    expect(typeof feel.hitStop).toBe("function");
    expect(typeof feel.juice).toBe("function");
  });

  it("hitStop honors reduced motion (resolves immediately)", async () => {
    const t0 = Date.now();
    await feel.hitStop(500, true);
    expect(Date.now() - t0).toBeLessThan(50);
  });

  it("screenShake on null element returns null", () => {
    expect(feel.screenShake(null)).toBe(null);
  });
});
