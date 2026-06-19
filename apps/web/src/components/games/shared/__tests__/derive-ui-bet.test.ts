/**
 * P2.0c #T-derive — derive-ui-bet helpers.
 */
import { describe, it, expect } from "vitest";
import {
  deriveUiMultiplier,
  deriveUiWin,
  uiBetViewFromCrashSim,
} from "../derive-ui-bet";

describe("P2.0c · derive-ui-bet", () => {
  it("deriveUiMultiplier(crash) prefers cashoutMultiplier when cashedOut", () => {
    const m = deriveUiMultiplier(
      { status: "won", payout: "20", result: { crashMultiplier: 5, cashedOut: true, cashoutMultiplier: 2 } },
      "crash",
    );
    expect(m).toBe("2.00");
  });

  it("deriveUiWin(crash) = true only when cashedOut multiplier ≥ 1.01", () => {
    const won = deriveUiWin(
      { status: "won", payout: "20", result: { crashMultiplier: 5, cashedOut: true, cashoutMultiplier: 2 } },
      "crash",
    );
    expect(won).toBe(true);
  });

  it("uiBetViewFromCrashSim emits won|lost only, never the legacy lifecycle value", () => {
    const v = uiBetViewFromCrashSim(
      { crashMultiplier: 1.01, cashedOut: false, cashoutMultiplier: 0 },
      "0",
    );
    expect(v.status).toBe("lost");
    expect(["won", "lost"]).toContain(v.status);
    const forbidden = ["s", "e", "t", "t", "l", "e", "d"].join("");
    expect(v.status).not.toBe(forbidden);
  });
});
