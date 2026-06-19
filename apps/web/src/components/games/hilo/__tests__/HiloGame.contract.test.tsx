/**
 * HiloGame — frozen-contract test.
 * Verifies PHONARA `ImportedGameSurfaceProps` wiring without touching visuals.
 * Uses the back-compat alias `HiloGame` re-exported from `ImportedHiloGame`.
 *
 * Phase 5 v1 LOCK: primary CTA on ready path goes through RG gate (await),
 * so onOpenBetConfirm assertion uses waitFor.
 */
import { describe, expect, it } from "vitest";
import { render, screen, fireEvent as evt, waitFor } from "@testing-library/react";
import { HiloGame } from "../index";
import { makeSurfaceProps } from "@/games/__tests__/contractHelpers";

describe("HiloGame — frozen contract", () => {
  it("renders the required PHONARA testid anchors (money + non-money optionals)", () => {
    render(<HiloGame {...makeSurfaceProps("hilo")} />);
    // money essentials present in the unopened DOM:
    expect(screen.getByTestId("casino-stake-input")).toBeInTheDocument();
    expect(screen.getByTestId("casino-place-bet")).toBeInTheDocument();
    expect(screen.getByTestId("casino-prepare-hash")).toBeInTheDocument();
    // non-money optionals (Phase 5 LOCK):
    expect(screen.getByTestId("casino-game-rules")).toBeInTheDocument();
    expect(screen.getByTestId("casino-presence-ghost")).toBeInTheDocument();
  });

  it("calls onPrepareRound when the prepare CTA is pressed", () => {
    const props = makeSurfaceProps("hilo");
    render(<HiloGame {...props} />);
    evt.click(screen.getByTestId("casino-prepare-hash"));
    expect(props.onPrepareRound).toHaveBeenCalledTimes(1);
  });

  it("calls onPrepareRound from the primary CTA when no commitment exists", () => {
    const props = makeSurfaceProps("hilo", { commitment: null });
    render(<HiloGame {...props} />);
    evt.click(screen.getByTestId("casino-place-bet"));
    expect(props.onPrepareRound).toHaveBeenCalled();
  });

  it("calls onOpenBetConfirm from the primary CTA once a commitment + guess exists (after RG gate)", async () => {
    const props = makeSurfaceProps("hilo", {
      commitment: { round_id: "r1", server_seed_hash: "h".repeat(64) },
      selection: { startCard: 7, guesses: ["higher"] },
    });
    render(<HiloGame {...props} />);
    evt.click(screen.getByTestId("casino-place-bet"));
    await waitFor(() => expect(props.onOpenBetConfirm).toHaveBeenCalledTimes(1));
  });

  it("emits onStakeChange when the stake input changes", () => {
    const props = makeSurfaceProps("hilo");
    render(<HiloGame {...props} />);
    evt.change(screen.getByTestId("casino-stake-input"), {
      target: { value: "25" },
    });
    expect(props.onStakeChange).toHaveBeenCalled();
  });

  it("disables the primary CTA while busy", () => {
    render(<HiloGame {...makeSurfaceProps("hilo", { busy: true })} />);
    expect(screen.getByTestId("casino-place-bet")).toBeDisabled();
  });
});
