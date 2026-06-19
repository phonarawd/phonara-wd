/**
 * Blackjack · playBlackjack — pure mirror parity tests.
 *
 *  - Dealer S17 (stops drawing at >=17).
 *  - Natural blackjack = 2.5×.
 *  - Push (equal scores) = 1×.
 *  - Player bust = 0×.
 *  - Floats injection is deterministic.
 *  - `@phonara/game-engine` is NEVER imported (red-grep #9 guarded separately).
 */
import { describe, it, expect } from "vitest";
import { playBlackjack, handScore } from "../playBlackjack";

// Helpers — pin specific cards via float = cardIndex / 52 + epsilon.
const C = (idx: number) => (idx + 0.5) / 52;

describe("Blackjack · playBlackjack — engine mirror parity", () => {
  it("NATURAL — A♠(0) + 10♠(9), no actions → 2.5", () => {
    // player 2 cards, then dealer 2 cards (any).
    const floats = [C(0), C(9), C(13), C(14), C(15), C(16)];
    const out = playBlackjack({ actions: [] }, floats);
    expect(out.totalMultiplier).toBe(2.5);
  });

  it("S17 STAND — dealer drawn cards stop once score >= 17", () => {
    // player 5♠(4)+6♠(5)=11, stand. dealer 9♠(8)+8♠(7)=17 → must stop.
    const floats = [
      C(4),
      C(5),
      C(8),
      C(7),
      // Sentinel: if dealer drew, this card (10♠=9) would push to 27 (bust → 0×).
      // If S17 holds, this float is never consumed.
      C(9),
    ];
    const out = playBlackjack({ actions: [{ seat: 0, move: "stand" }] }, floats);
    // player 11 vs dealer 17 → player loses (0×). If dealer wrongly hit and busted, would be 2×.
    expect(out.totalMultiplier).toBe(0);
  });

  it("PUSH — both 20 → totalMultiplier === 1 (UI treats as neutral, not WIN)", () => {
    // player 10♠(9)+10♥(22) = 20, dealer 10♦(35)+10♣(48) = 20.
    const floats = [C(9), C(22), C(35), C(48)];
    const out = playBlackjack({ actions: [{ seat: 0, move: "stand" }] }, floats);
    expect(out.totalMultiplier).toBe(1);
  });

  it("BUST — player hits to >21 → 0×", () => {
    // 10♠(9) + Q♠(11) = 20, hit → 5♠(4) = 25 (bust).
    const floats = [C(9), C(11), C(13), C(14), C(4)];
    const out = playBlackjack(
      { actions: [{ seat: 0, move: "hit" }] },
      floats,
    );
    expect(out.totalMultiplier).toBe(0);
  });

  it("DETERMINISTIC — same floats + same actions → same multiplier", () => {
    const floats = [0.01, 0.5, 0.2, 0.8, 0.3, 0.6, 0.4, 0.7];
    const sel = { actions: [{ seat: 0, move: "stand" as const }] };
    const a = playBlackjack(sel, floats);
    const b = playBlackjack(sel, floats);
    expect(a.totalMultiplier).toBe(b.totalMultiplier);
  });
});

describe("Blackjack · handScore — Ace soft/hard handling", () => {
  it("A + 10 = 21 (soft Ace as 11)", () => {
    expect(handScore([0, 9])).toBe(21);
  });
  it("A + A = 12 (one Ace downgrades)", () => {
    expect(handScore([0, 13])).toBe(12);
  });
  it("A + 9 + 5 = 15 (Ace downgrades from 11 to 1)", () => {
    expect(handScore([0, 8, 4])).toBe(15);
  });
});
