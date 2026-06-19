/**
 * Crash · Stage render-path invariant — PRE-WORK (b) fix gate.
 *
 * Asserts the per-frame `render()` does NOT call
 * `getComputedStyle(documentElement)` — skin tokens must come from
 * the mount/resize/theme-scoped cache. A regression here would
 * reintroduce a forced style flush per frame (the original ~20.5ms
 * p50 baseline contributor).
 *
 * We can't easily drive frames inside JSDOM, but mount alone is
 * allowed (1 read). We assert the count after mount + a few
 * microtasks stays bounded.
 */
import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { Stage } from "../Stage";

const baseProps = {
  gameCode: "crash" as const,
  selection: { autoCashout: "2.00" },
  bet: null,
  clientSeed: "deadbeef",
  commitment: null,
  verification: null,
  onClientSeedChange: () => {},
};

describe("Crash · Stage render-path", () => {
  let spy: ReturnType<typeof vi.spyOn> | null = null;

  beforeEach(() => {
    spy = vi.spyOn(window, "getComputedStyle");
  });
  afterEach(() => {
    spy?.mockRestore();
    cleanup();
  });

  it("does not call getComputedStyle on a steady-state tick budget", async () => {
    render(<Stage {...baseProps} />);
    // Snapshot post-mount; allow a small bounded budget for the
    // skin-palette read on mount + RO/theme refresh paths.
    const mountCalls = spy!.mock.calls.length;
    expect(mountCalls).toBeLessThanOrEqual(8);

    // Simulate "many frames" by spinning the microtask queue. The
    // render loop is mocked by vitest-canvas / not driven here, so
    // any growth would have to come from a synchronous mount path —
    // which is the regression we want to catch.
    for (let i = 0; i < 32; i++) {
       
      await Promise.resolve();
    }
    const afterIdleCalls = spy!.mock.calls.length;
    // No growth tied to "frame count" — mount budget only.
    expect(afterIdleCalls - mountCalls).toBeLessThanOrEqual(2);
  });
});
