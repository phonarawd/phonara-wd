import { describe, it, expect } from "vitest";
import * as replay from "../replay";

describe("F · replay", () => {
  it("exports createRecorder / snapshot", () => {
    expect(typeof replay.createRecorder).toBe("function");
    expect(typeof replay.snapshot).toBe("function");
  });

  it("createRecorder with null canvas stays idle", () => {
    const r = replay.createRecorder(null);
    expect(r.state).toBe("idle");
    r.start();
    expect(r.state).toBe("idle");
  });

  it("snapshot(null) returns null", async () => {
    expect(await replay.snapshot(null)).toBeNull();
  });
});
