/**
 * MintReelsGame — frozen-contract test.
 * PHONARA `ImportedGameSurfaceProps` wiring; visuals untouched.
 */
import { describe, expect, it } from "vitest";
import { render, screen, fireEvent as evt, waitFor } from "@testing-library/react";
import { ImportedMintReelsGame } from "../index";
import { makeSurfaceProps } from "@/games/__tests__/contractHelpers";

describe("MintReelsGame — frozen contract", () => {
  it("renders required PHONARA testid anchors", () => {
    render(<ImportedMintReelsGame {...makeSurfaceProps("mint_reels")} />);
    expect(screen.getByTestId("casino-stake-input")).toBeInTheDocument();
    expect(screen.getByTestId("casino-place-bet")).toBeInTheDocument();
    expect(screen.getByTestId("casino-prepare-hash")).toBeInTheDocument();
  });

  it("uses underscore gameCode `mint_reels`", () => {
    const props = makeSurfaceProps("mint_reels");
    expect(props.gameCode).toBe("mint_reels");
  });

  it("defaults selection to { lines: 20 } per PHONARA game-config", () => {
    const props = makeSurfaceProps("mint_reels");
    expect(props.selection).toEqual({ lines: 20 });
  });

  it("routes primary CTA → onPrepareRound when no commitment", () => {
    const props = makeSurfaceProps("mint_reels");
    render(<ImportedMintReelsGame {...props} />);
    evt.click(screen.getByTestId("casino-place-bet"));
    expect(props.onPrepareRound).toHaveBeenCalled();
  });

  it("routes primary CTA → onOpenBetConfirm once commitment exists (after RG gate)", async () => {
    const props = makeSurfaceProps("mint_reels", {
      commitment: { round_id: "r1", server_seed_hash: "h".repeat(64) },
    });
    render(<ImportedMintReelsGame {...props} />);
    evt.click(screen.getByTestId("casino-place-bet"));
    await waitFor(() => expect(props.onOpenBetConfirm).toHaveBeenCalledTimes(1));
  });

  it("disables primary CTA while busy", () => {
    render(<ImportedMintReelsGame {...makeSurfaceProps("mint_reels", { busy: true })} />);
    expect(screen.getByTestId("casino-place-bet")).toBeDisabled();
  });
});
