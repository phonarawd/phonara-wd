/**
 * Blackjack · LOCAL MIRROR — engine `packages/game-engine/src/games/blackjack.ts` 1:1.
 *
 * Phase 4 v1 RED LOCK FINAL+:
 *  - `@phonara/game-engine` static import 0 (Lovable preview-only mirror).
 *  - Client RNG 0 — floats are injected (deterministic).
 *  - Returns ONLY `{ totalMultiplier: number }` — same shape as PHONARA `BetResult`.
 *  - Dealer stands on all 17s (S17).
 *  - Natural blackjack = 2.5× cap.
 *  - Push (equal scores) = 1× (UI must treat `===1` as neutral, not WIN).
 *  - `insurance` branch is dead code (v1 UI never sends it).
 *
 * Card encoding: integer 0..51 (rank = `c % 13`, 0=A · 1..9=2..10 · 10..12=J/Q/K).
 * Ace counts as 11; downgrades to 1 while score > 21 (per-ace).
 */

import type { BlackjackSelection, BlackjackMove } from "../shared/types";

type Card = number;

/** Card rank index 0..12 (0=Ace, 12=King). */
function rank(c: Card): number {
  return ((c % 13) + 13) % 13;
}

/** Best blackjack score: aces start at 11 and downgrade individually. */
export function handScore(cards: Card[]): number {
  let s = 0;
  let aces = 0;
  for (const c of cards) {
    const r = rank(c);
    if (r === 0) {
      s += 11;
      aces++;
    } else if (r >= 10) {
      s += 10;
    } else {
      s += r + 1;
    }
  }
  while (s > 21 && aces > 0) {
    s -= 10;
    aces--;
  }
  return s;
}

/** Deal a card by consuming the next float. Out-of-range floats → 0 (A♠). */
function drawCard(floats: number[], i: number): Card {
  const f = floats[i];
  if (typeof f !== "number" || !Number.isFinite(f) || f < 0 || f >= 1) return 0;
  return Math.floor(f * 52);
}

/**
 * Pure blackjack settler. Mirrors the PHONARA engine's contract; the only
 * value the surface (and adapter) is allowed to read is `totalMultiplier`.
 */
export function playBlackjack(
  selection: BlackjackSelection,
  floats: number[],
): { totalMultiplier: number } {
  let fi = 0;
  const draw = (): Card => drawCard(floats, fi++);

  // Initial deal — player, dealer.
  const player: Card[] = [draw(), draw()];
  const dealer: Card[] = [draw(), draw()];

  let doubled = false;
  let finished = false;
  let didSplit = false;

  for (const a of selection.actions) {
    if (finished) break;
    const move: BlackjackMove = a.move;
    if (move === "hit") {
      player.push(draw());
      if (handScore(player) > 21) {
        break;
      }
    } else if (move === "stand") {
      finished = true;
    } else if (move === "double") {
      player.push(draw());
      doubled = true;
      finished = true;
    } else if (move === "split") {
      // v1 simplified: only flag split for natural-disqualification + suppress
      // the natural 2.5× bonus. Multi-hand resolution is engine-owned.
      didSplit = true;
    } else if (move === "insurance") {
      // Dead code path — v1 UI never sends `insurance`; engine settles it as
      // a side bet and the totalMultiplier branch below is unaffected.
    }
  }

  const pScore = handScore(player);
  if (pScore > 21) {
    return { totalMultiplier: 0 };
  }

  // Dealer S17 — stand on all 17s.
  while (handScore(dealer) < 17) {
    dealer.push(draw());
  }
  const dScore = handScore(dealer);

  // Natural blackjack: first two cards = 21, no hit/double/split.
  const natural =
    player.length === 2 && pScore === 21 && !doubled && !didSplit;

  let mult: number;
  if (natural) {
    mult = 2.5;
  } else if (dScore > 21 || pScore > dScore) {
    mult = 2;
  } else if (pScore === dScore) {
    mult = 1; // push
  } else {
    mult = 0;
  }

  if (doubled && mult > 0 && mult < 2.5) {
    // Doubled stake → settlement multiplier doubles (capped below 2.5 path).
    mult = mult * 2;
  }

  return { totalMultiplier: mult };
}
