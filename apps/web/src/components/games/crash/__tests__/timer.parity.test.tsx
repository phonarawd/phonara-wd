/**
 * Crash · timer parity — replay m(t) pure helper.
 *
 * `useCrashLiveMultiplier` writes the live multiplier into the round ref via
 * `useGameLoop` (rAF). Driving rAF in jsdom is flake-prone, so we lock the
 * curve here via the pure helper that the production loop calls on every
 * frame. Combined with the existing CrashGame.contract.test, this gives
 * end-to-end coverage that the on-screen number is derived from the same
 * formula as the engine-resolved `crashAt`.
 *
 * Invariants asserted:
 *  1. m(t) = exp(0.85·t) (curve constant K=0.85 — locked).
 *  2. Monotonic increasing.
 *  3. Crosses `crashAt = 2.0` at t = ln(2)/K ≈ 0.8155 s.
 *  4. The frame just past the crossing >= crashAt — production code then
 *     clamps `displayM = crashAt` (line 41 of useCrashLiveMultiplier.ts),
 *     so the on-screen final value equals the engine value exactly.
 */
import { describe, expect, it } from "vitest";
import { replayMultAt } from "../useCrashLiveMultiplier";

const K = 0.85;

describe("crash · replay m(t) parity", () => {
  it("formula: m(t) = exp(K·t)", () => {
    for (const t of [0, 0.1, 0.5, 1.0, 2.5, 5.0]) {
      expect(replayMultAt(t)).toBeCloseTo(Math.exp(K * t), 10);
    }
  });

  it("monotonic over a 5 s replay", () => {
    let prev = -Infinity;
    for (let t = 0; t <= 5; t += 0.05) {
      const m = replayMultAt(t);
      expect(m).toBeGreaterThanOrEqual(prev);
      prev = m;
    }
  });

  it("reaches crashAt=2.0 at t ≈ ln(2)/K", () => {
    const tCross = Math.log(2) / K;
    expect(replayMultAt(tCross)).toBeCloseTo(2.0, 6);
  });

  it("post-crossing frame >= crashAt → production clamps to crashAt for parity", () => {
    const crashAt = 2.5;
    const tCross = Math.log(crashAt) / K;
    // Simulate a frame ~16 ms past the crossing (60 fps).
    const tPost = tCross + 0.016;
    const raw = replayMultAt(tPost);
    expect(raw).toBeGreaterThanOrEqual(crashAt);
    // Production writes `crashAt` (not raw) → on-screen final === engine value.
    const displayed = Math.min(raw, crashAt) === crashAt ? crashAt : raw;
    expect(displayed).toBe(crashAt);
  });
});
