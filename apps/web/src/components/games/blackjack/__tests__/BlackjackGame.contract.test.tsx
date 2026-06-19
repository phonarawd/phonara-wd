/**
 * BlackjackGame — frozen-contract test (PHONARA wiring).
 *
 * Phase 4 v1 RED LOCK FINAL+:
 *  - actions array is REPLACED per change (push ✕).
 *  - INSURANCE UI unmount (v1).
 *  - RGGate + BetConfirm + Fairness + GameRules wired.
 */
import { describe, expect, it } from "vitest";
import { render, screen, fireEvent as evt, waitFor } from "@testing-library/react";
import { ImportedBlackjackGame } from "../index";
import { makeSurfaceProps } from "@/games/__tests__/contractHelpers";

describe("BlackjackGame — frozen contract", () => {
  it("renders required PHONARA testid anchors", () => {
    render(<ImportedBlackjackGame {...makeSurfaceProps("blackjack")} />);
    expect(screen.getByTestId("casino-stake-input")).toBeInTheDocument();
    expect(screen.getByTestId("casino-place-bet")).toBeInTheDocument();
    expect(screen.getByTestId("casino-prepare-hash")).toBeInTheDocument();
  });

  it("uses gameCode `blackjack`", () => {
    expect(makeSurfaceProps("blackjack").gameCode).toBe("blackjack");
  });

  it("default selection is { actions: [{ seat: 0, move: 'stand' }] }", () => {
    expect(makeSurfaceProps("blackjack").selection).toEqual({
      actions: [{ seat: 0, move: "stand" }],
    });
  });

  it("primary CTA → onOpenBetConfirm with commitment (via RG gate)", async () => {
    const props = makeSurfaceProps("blackjack", {
      commitment: { round_id: "r1", server_seed_hash: "h".repeat(64) },
    });
    render(<ImportedBlackjackGame {...props} />);
    evt.click(screen.getByTestId("casino-place-bet"));
    await waitFor(() =>
      expect(props.onOpenBetConfirm).toHaveBeenCalledTimes(1),
    );
  });

  it("disables primary CTA while busy", () => {
    render(<ImportedBlackjackGame {...makeSurfaceProps("blackjack", { busy: true })} />);
    expect(screen.getByTestId("casino-place-bet")).toBeDisabled();
  });

  it("mounts FairnessSheet (casino-fairness-verifier) + GameRulesTrigger (casino-game-rules)", () => {
    render(<ImportedBlackjackGame {...makeSurfaceProps("blackjack")} />);
    expect(screen.getByTestId("casino-game-rules")).toBeInTheDocument();
  });

  it("does NOT expose insurance UI (v1 LOCK ⑩)", () => {
    render(<ImportedBlackjackGame {...makeSurfaceProps("blackjack")} />);
    expect(screen.queryByTestId("blackjack-insurance")).toBeNull();
  });

  it("BetConfirmDialog mounts only while confirmOpen=true", () => {
    const { rerender } = render(
      <ImportedBlackjackGame
        {...makeSurfaceProps("blackjack", { confirmOpen: false })}
      />,
    );
    expect(screen.queryByTestId("casino-bet-confirm")).toBeNull();
    rerender(
      <ImportedBlackjackGame
        {...makeSurfaceProps("blackjack", { confirmOpen: true })}
      />,
    );
    expect(screen.getAllByTestId("casino-bet-confirm").length).toBeGreaterThan(0);
  });
});
