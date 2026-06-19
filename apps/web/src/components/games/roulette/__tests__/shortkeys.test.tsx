/**
 * Roulette · shortkeys integration smoke — Space 3-state caller-side.
 *
 * Renders ImportedRouletteGame and exercises useGameShortkeys via real DOM keys.
 * Roulette Space (3-state, bets.length 가드 추가):
 *   confirmOpen → no-op
 *   bets.length === 0 → no-op (additional guard vs Dice)
 *   !commitment → prepare
 *   commitment  → openConfirm
 */
import { describe, it, expect } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { ImportedRouletteGame } from "..";
import { makeSurfaceProps } from "@/games/__tests__/contractHelpers";

describe("Roulette · shortkeys (Space 3-state)", () => {
  it("Space with no commitment + bets present → onPrepareRound", () => {
    const props = makeSurfaceProps("roulette", { commitment: null });
    render(<ImportedRouletteGame {...props} />);
    fireEvent.keyDown(window, { key: " " });
    expect(props.onPrepareRound).toHaveBeenCalledTimes(1);
    expect(props.onOpenBetConfirm).not.toHaveBeenCalled();
  });

  it("Space after commitment + bets present → onOpenBetConfirm", async () => {
    const props = makeSurfaceProps("roulette", {
      commitment: { round_id: "r1", server_seed_hash: "h".repeat(64) },
    });
    render(<ImportedRouletteGame {...props} />);
    fireEvent.keyDown(window, { key: " " });
    await waitFor(() =>
      expect(props.onOpenBetConfirm).toHaveBeenCalledTimes(1),
    );
    expect(props.onPrepareRound).not.toHaveBeenCalled();
  });

  it("Space with empty bets[] → no-op (additional guard vs Dice)", () => {
    const props = makeSurfaceProps("roulette", {
      commitment: { round_id: "r1", server_seed_hash: "h".repeat(64) },
      selection: { bets: [] },
    });
    render(<ImportedRouletteGame {...props} />);
    fireEvent.keyDown(window, { key: " " });
    expect(props.onPrepareRound).not.toHaveBeenCalled();
    expect(props.onOpenBetConfirm).not.toHaveBeenCalled();
  });

  it("Space while confirmOpen=true → no-op", () => {
    const props = makeSurfaceProps("roulette", {
      commitment: { round_id: "r1", server_seed_hash: "h".repeat(64) },
      confirmOpen: true,
    });
    render(<ImportedRouletteGame {...props} />);
    fireEvent.keyDown(window, { key: " " });
    expect(props.onPrepareRound).not.toHaveBeenCalled();
    expect(props.onOpenBetConfirm).not.toHaveBeenCalled();
  });

  it("Esc while confirmOpen=true → onCancelBetConfirm", () => {
    const props = makeSurfaceProps("roulette", { confirmOpen: true });
    render(<ImportedRouletteGame {...props} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(props.onCancelBetConfirm).toHaveBeenCalledTimes(1);
  });

  it("5 → MAX stake (capped at availableBalance)", () => {
    const props = makeSurfaceProps("roulette", {
      stake: "10",
      availableBalance: "12345",
    });
    render(<ImportedRouletteGame {...props} />);
    fireEvent.keyDown(window, { key: "5" });
    expect(props.onStakeChange).toHaveBeenCalledWith("12345");
  });
});
