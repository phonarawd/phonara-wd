/**
 * MinesGame — frozen-contract test.
 * Verifies PHONARA `ImportedGameSurfaceProps` wiring without touching visuals.
 */
import { describe, expect, it } from "vitest";
import { render, screen, fireEvent as evt, waitFor } from "@testing-library/react";
import { MinesGame } from "..";
import { makeSurfaceProps } from "@/games/__tests__/contractHelpers";

describe("MinesGame — frozen contract", () => {
  it("renders the required PHONARA testid anchors", () => {
    render(<MinesGame {...makeSurfaceProps("mines")} />);
    expect(screen.getByTestId("casino-stake-input")).toBeInTheDocument();
    expect(screen.getByTestId("casino-place-bet")).toBeInTheDocument();
    expect(screen.getByTestId("casino-prepare-hash")).toBeInTheDocument();
  });

  it("calls onPrepareRound when the prepare CTA is pressed", () => {
    const props = makeSurfaceProps("mines");
    render(<MinesGame {...props} />);
    evt.click(screen.getByTestId("casino-prepare-hash"));
    expect(props.onPrepareRound).toHaveBeenCalledTimes(1);
  });

  it("calls onPrepareRound from the primary CTA when no commitment exists", () => {
    const props = makeSurfaceProps("mines", { commitment: null });
    render(<MinesGame {...props} />);
    evt.click(screen.getByTestId("casino-place-bet"));
    expect(props.onPrepareRound).toHaveBeenCalled();
  });

  it("calls onOpenBetConfirm from the primary CTA once a commitment exists (after RG gate)", async () => {
    const props = makeSurfaceProps("mines", {
      commitment: { round_id: "r1", server_seed_hash: "h".repeat(64) },
      selection: { mineCount: 3, revealedCells: [0] },
    });
    render(<MinesGame {...props} />);
    evt.click(screen.getByTestId("casino-place-bet"));
    await waitFor(() => expect(props.onOpenBetConfirm).toHaveBeenCalledTimes(1));
  });

  it("emits onStakeChange when the stake input changes", () => {
    const props = makeSurfaceProps("mines");
    render(<MinesGame {...props} />);
    evt.change(screen.getByTestId("casino-stake-input"), {
      target: { value: "25" },
    });
    expect(props.onStakeChange).toHaveBeenCalled();
  });

  it("disables the primary CTA while busy", () => {
    render(<MinesGame {...makeSurfaceProps("mines", { busy: true })} />);
    expect(screen.getByTestId("casino-place-bet")).toBeDisabled();
  });
});
