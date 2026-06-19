/**
 * GoldRushGame — frozen-contract test.
 * PHONARA `ImportedGameSurfaceProps` wiring; visuals untouched.
 * §8-B v1 LOCK — MintReels 패턴 1:1 (7케이스).
 */
import { describe, expect, it } from "vitest";
import { render, screen, fireEvent as evt, waitFor } from "@testing-library/react";
import { ImportedGoldRushGame } from "../index";
import { makeSurfaceProps } from "@/games/__tests__/contractHelpers";

describe("GoldRushGame — frozen contract", () => {
  it("renders required PHONARA testid anchors", () => {
    render(<ImportedGoldRushGame {...makeSurfaceProps("gold_rush")} />);
    expect(screen.getByTestId("casino-stake-input")).toBeInTheDocument();
    expect(screen.getByTestId("casino-place-bet")).toBeInTheDocument();
    expect(screen.getByTestId("casino-prepare-hash")).toBeInTheDocument();
  });

  it("uses underscore gameCode `gold_rush`", () => {
    const props = makeSurfaceProps("gold_rush");
    expect(props.gameCode).toBe("gold_rush");
  });

  it("defaults selection to { lines: 20 } per PHONARA game-config", () => {
    const props = makeSurfaceProps("gold_rush");
    expect(props.selection).toEqual({ lines: 20 });
  });

  it("routes primary CTA → onPrepareRound when no commitment", () => {
    const props = makeSurfaceProps("gold_rush");
    render(<ImportedGoldRushGame {...props} />);
    evt.click(screen.getByTestId("casino-place-bet"));
    expect(props.onPrepareRound).toHaveBeenCalled();
  });

  it("routes primary CTA → onOpenBetConfirm once commitment exists (after RG gate)", async () => {
    const props = makeSurfaceProps("gold_rush", {
      commitment: { round_id: "r1", server_seed_hash: "h".repeat(64) },
    });
    render(<ImportedGoldRushGame {...props} />);
    evt.click(screen.getByTestId("casino-place-bet"));
    await waitFor(() => expect(props.onOpenBetConfirm).toHaveBeenCalledTimes(1));
  });

  it("disables primary CTA while busy", () => {
    render(<ImportedGoldRushGame {...makeSurfaceProps("gold_rush", { busy: true })} />);
    expect(screen.getByTestId("casino-place-bet")).toBeDisabled();
  });

  it("mounts BetConfirmDialog when confirmOpen=true", () => {
    const props = makeSurfaceProps("gold_rush", { confirmOpen: true });
    render(<ImportedGoldRushGame {...props} />);
    expect(screen.getByTestId("casino-bet-confirm")).toBeInTheDocument();
    expect(screen.getByTestId("casino-bet-confirm-confirm")).toBeInTheDocument();
    expect(screen.getByTestId("casino-bet-confirm-cancel")).toBeInTheDocument();
  });
});
