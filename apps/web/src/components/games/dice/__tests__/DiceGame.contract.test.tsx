/**
 * DiceGame — frozen-contract test.
 * Verifies PHONARA `ImportedGameSurfaceProps` wiring without touching visuals.
 */
import { describe, expect, it } from "vitest";
import { render, screen, fireEvent as evt } from "@testing-library/react";
import { DiceGame } from "../index";
import { makeSurfaceProps } from "@/games/__tests__/contractHelpers";

describe("DiceGame — frozen contract", () => {
  it("renders the required PHONARA testid anchors (Money 9 + non-money 2)", () => {
    render(<DiceGame {...makeSurfaceProps("dice")} />);
    expect(screen.getByTestId("casino-stake-input")).toBeInTheDocument();
    expect(screen.getByTestId("casino-place-bet")).toBeInTheDocument();
    expect(screen.getByTestId("casino-prepare-hash")).toBeInTheDocument();
    expect(screen.getByTestId("casino-game-rules")).toBeInTheDocument();
    expect(screen.getByTestId("casino-presence-ghost")).toBeInTheDocument();
  });

  it("calls onPrepareRound when the prepare CTA is pressed", () => {
    const props = makeSurfaceProps("dice");
    render(<DiceGame {...props} />);
    evt.click(screen.getByTestId("casino-prepare-hash"));
    expect(props.onPrepareRound).toHaveBeenCalledTimes(1);
  });

  it("calls onPrepareRound from the primary CTA when no commitment exists", () => {
    const props = makeSurfaceProps("dice", { commitment: null });
    render(<DiceGame {...props} />);
    evt.click(screen.getByTestId("casino-place-bet"));
    expect(props.onPrepareRound).toHaveBeenCalled();
  });

  it("calls onOpenBetConfirm from the primary CTA once a commitment exists (after RG gate)", async () => {
    const props = makeSurfaceProps("dice", {
      commitment: { round_id: "r1", server_seed_hash: "h".repeat(64) },
    });
    render(<DiceGame {...props} />);
    evt.click(screen.getByTestId("casino-place-bet"));
    await new Promise((r) => setTimeout(r, 0));
    expect(props.onOpenBetConfirm).toHaveBeenCalledTimes(1);
  });

  it("emits onStakeChange when the stake input changes", () => {
    const props = makeSurfaceProps("dice");
    render(<DiceGame {...props} />);
    evt.change(screen.getByTestId("casino-stake-input"), {
      target: { value: "25" },
    });
    expect(props.onStakeChange).toHaveBeenCalled();
  });

  it("disables the primary CTA while busy", () => {
    render(<DiceGame {...makeSurfaceProps("dice", { busy: true })} />);
    expect(screen.getByTestId("casino-place-bet")).toBeDisabled();
  });
});
