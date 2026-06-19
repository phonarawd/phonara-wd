/**
 * Blackjack · actions REPLACE semantics + bust gate + insurance unmount + split seat-flip.
 */
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent as evt } from "@testing-library/react";
import { ImportedBlackjackGame } from "..";
import { makeSurfaceProps } from "@/games/__tests__/contractHelpers";

const COMMITMENT = { round_id: "r1", server_seed_hash: "h".repeat(64) };

describe("Blackjack · actions REPLACE + bust gate", () => {
  it("hit click → onSelectionChange called with REPLACED actions[] (not push to live array)", () => {
    const initialActions = [{ seat: 0, move: "hit" as const }];
    const props = makeSurfaceProps("blackjack", {
      commitment: COMMITMENT,
      selection: { actions: initialActions },
    });
    render(<ImportedBlackjackGame {...props} />);
    evt.click(screen.getByTestId("blackjack-hit"));
    expect(props.onSelectionChange).toHaveBeenCalledTimes(1);
    const arg = (props.onSelectionChange as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as { actions: { seat: number; move: string }[] };
    expect(arg.actions).toHaveLength(2);
    expect(arg.actions[0]).toEqual({ seat: 0, move: "hit" });
    expect(arg.actions[1]).toEqual({ seat: 0, move: "hit" });
    // Caller-passed array must be untouched (REPLACE, not push).
    expect(initialActions).toHaveLength(1);
  });

  it("after stand → all action buttons disabled (no further actions accepted)", () => {
    const props = makeSurfaceProps("blackjack", {
      commitment: COMMITMENT,
      selection: { actions: [{ seat: 0, move: "stand" }] },
    });
    render(<ImportedBlackjackGame {...props} />);
    expect(screen.getByTestId("blackjack-hit")).toBeDisabled();
    expect(screen.getByTestId("blackjack-double")).toBeDisabled();
    expect(screen.getByTestId("blackjack-split")).toBeDisabled();
  });

  it("bust (preview hand > 21) → all action buttons disabled", () => {
    const props = makeSurfaceProps("blackjack", {
      commitment: COMMITMENT,
      selection: { actions: [{ seat: 0, move: "hit" }] },
      bet: {
        status: "won",
        payout: "0",
        multiplier: "0",
        // 10♠ (9) + Q♠ (11) + 5♠ (4) = 25
        result: { totalMultiplier: "0.00", player: [9, 11, 4], dealer: [9, 9] },
      },
    });
    render(<ImportedBlackjackGame {...props} />);
    expect(screen.getByTestId("blackjack-hit")).toBeDisabled();
    expect(screen.getByTestId("blackjack-stand")).toBeDisabled();
    expect(screen.getByTestId("blackjack-double")).toBeDisabled();
    expect(screen.getByTestId("blackjack-split")).toBeDisabled();
  });

  it("INSURANCE button is unmounted (v1 UI never exposes insurance)", () => {
    const props = makeSurfaceProps("blackjack", { commitment: COMMITMENT });
    render(<ImportedBlackjackGame {...props} />);
    expect(screen.queryByTestId("blackjack-insurance")).toBeNull();
  });

  it("split after first action → subsequent actions REPLACE with seat 1", () => {
    const props = makeSurfaceProps("blackjack", {
      commitment: COMMITMENT,
      selection: { actions: [{ seat: 0, move: "split" }] },
    });
    render(<ImportedBlackjackGame {...props} />);
    evt.click(screen.getByTestId("blackjack-stand"));
    const arg = (props.onSelectionChange as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as { actions: { seat: number; move: string }[] };
    expect(arg.actions).toHaveLength(2);
    expect(arg.actions[0]).toEqual({ seat: 0, move: "split" });
    expect(arg.actions[1]).toEqual({ seat: 1, move: "stand" });
  });

  it("pre-commit (commitment null) → hit click still queues via onSelectionChange", () => {
    // selection.actions ≠ bet — queuing actions before hash commit is allowed
    // in pre-commit blackjack. Mock pipeline picks the queue up on prepare→submit.
    const props = makeSurfaceProps("blackjack", {
      commitment: null,
      selection: { actions: [] },
    });
    render(<ImportedBlackjackGame {...props} />);
    evt.click(screen.getByTestId("blackjack-hit"));
    expect(props.onSelectionChange).toHaveBeenCalledTimes(1);
    const arg = (props.onSelectionChange as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as { actions: { seat: number; move: string }[] };
    expect(arg.actions).toEqual([{ seat: 0, move: "hit" }]);
  });

  it("pre-commit place-bet click → onPrepareRound (NOT onOpenBetConfirm)", () => {
    // Regression guard: handlePrimary `if (ready) confirm; else prepare;` —
    // commitment + Confirm + hash stay as hard preconditions for real RPC.
    const props = makeSurfaceProps("blackjack", {
      commitment: null,
      selection: { actions: [{ seat: 0, move: "hit" }] },
    });
    render(<ImportedBlackjackGame {...props} />);
    evt.click(screen.getByTestId("casino-place-bet"));
    expect(props.onPrepareRound).toHaveBeenCalledTimes(1);
    expect(props.onOpenBetConfirm).not.toHaveBeenCalled();
  });
});

// satisfy mock-helper type
import type { vi } from "vitest";
