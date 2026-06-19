/**
 * Blackjack · shortkeys integration smoke — Space 3-state caller-side.
 *
 *   confirmOpen → no-op
 *   !commitment → onPrepareRound
 *   commitment + !busted → onOpenBetConfirm
 *   busted (preview hand > 21) → no-op
 */
import { describe, it, expect } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { ImportedBlackjackGame } from "..";
import { makeSurfaceProps } from "@/games/__tests__/contractHelpers";

describe("Blackjack · shortkeys (Space 3-state)", () => {
  it("Space with no commitment → onPrepareRound", () => {
    const props = makeSurfaceProps("blackjack", { commitment: null });
    render(<ImportedBlackjackGame {...props} />);
    fireEvent.keyDown(window, { key: " " });
    expect(props.onPrepareRound).toHaveBeenCalledTimes(1);
    expect(props.onOpenBetConfirm).not.toHaveBeenCalled();
  });

  it("Space after commitment → onOpenBetConfirm", async () => {
    const props = makeSurfaceProps("blackjack", {
      commitment: { round_id: "r1", server_seed_hash: "h".repeat(64) },
    });
    render(<ImportedBlackjackGame {...props} />);
    fireEvent.keyDown(window, { key: " " });
    await waitFor(() =>
      expect(props.onOpenBetConfirm).toHaveBeenCalledTimes(1),
    );
    expect(props.onPrepareRound).not.toHaveBeenCalled();
  });

  it("Space while confirmOpen=true → no-op", () => {
    const props = makeSurfaceProps("blackjack", {
      commitment: { round_id: "r1", server_seed_hash: "h".repeat(64) },
      confirmOpen: true,
    });
    render(<ImportedBlackjackGame {...props} />);
    fireEvent.keyDown(window, { key: " " });
    expect(props.onPrepareRound).not.toHaveBeenCalled();
    expect(props.onOpenBetConfirm).not.toHaveBeenCalled();
  });

  it("Space with busted preview hand (>21) → no-op", () => {
    // 10♠ + 10♥ + 5♠ = 25 (bust).
    const props = makeSurfaceProps("blackjack", {
      commitment: { round_id: "r1", server_seed_hash: "h".repeat(64) },
      bet: {
        status: "won",
        payout: "0",
        multiplier: "0",
        result: {
          totalMultiplier: "0.00",
          player: [9, 22, 4],
          dealer: [9, 9],
        },
      },
    });
    render(<ImportedBlackjackGame {...props} />);
    fireEvent.keyDown(window, { key: " " });
    expect(props.onOpenBetConfirm).not.toHaveBeenCalled();
  });

  it("Esc while confirmOpen=true → onCancelBetConfirm", () => {
    const props = makeSurfaceProps("blackjack", { confirmOpen: true });
    render(<ImportedBlackjackGame {...props} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(props.onCancelBetConfirm).toHaveBeenCalledTimes(1);
  });

  it("5 → MAX stake (capped at availableBalance)", () => {
    const props = makeSurfaceProps("blackjack", {
      stake: "10",
      availableBalance: "12345",
    });
    render(<ImportedBlackjackGame {...props} />);
    fireEvent.keyDown(window, { key: "5" });
    expect(props.onStakeChange).toHaveBeenCalledWith("12345");
  });
});
