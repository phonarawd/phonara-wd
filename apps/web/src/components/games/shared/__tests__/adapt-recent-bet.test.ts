/**
 * P2.0c #T-adapt — recent-bet dual-shape normalization.
 */
import { describe, it, expect } from "vitest";
import {
  crashHistoryMultiplier,
  normalizeRecentBets,
  toStripRow,
} from "../adapt-recent-bet";
import type { PhonaraRecentBet, RecentBetStripRow } from "../types";

describe("P2.0c · adapt-recent-bet", () => {
  it("toStripRow normalizes PhonaraRecentBet (result_payload → result)", () => {
    const row: PhonaraRecentBet = {
      id: "x",
      game: "crash",
      currency: "PHON",
      stake: "10",
      payout: "20",
      result_payload: { crashMultiplier: 3.5 },
      created_at: 1700000000000,
    };
    const out = toStripRow(row);
    expect(out.win).toBe(true);
    expect(out.multiplier).toBe("2.00");
    expect((out.result as { crashMultiplier: number }).crashMultiplier).toBe(3.5);
  });

  it("normalizeRecentBets is a no-op for Lovable rows", () => {
    const row: RecentBetStripRow = {
      id: "y", game: "crash", currency: "PHON", stake: "10",
      payout: "10", multiplier: "1.00", at: 1, win: false,
      result: { crashMultiplier: 1.01 },
    };
    expect(normalizeRecentBets([row])[0]).toBe(row);
  });

  it("crashHistoryMultiplier reads result.crashMultiplier first, falls back to row.multiplier", () => {
    expect(crashHistoryMultiplier({
      id: "a", game: "crash", currency: "PHON", stake: "1", payout: "1",
      multiplier: "1.00", at: 0, win: false,
      result: { crashMultiplier: 7.25 },
    })).toBe(7.25);

    expect(crashHistoryMultiplier({
      id: "b", game: "crash", currency: "PHON", stake: "1", payout: "1",
      multiplier: "1.42", at: 0, win: false,
    })).toBe(1.42);
  });
});
