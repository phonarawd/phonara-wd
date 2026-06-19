/**
 * Dice · shortkeys integration smoke — Space 3-state caller-side.
 *
 * Renders ImportedDiceGame and exercises useGameShortkeys via real DOM keys.
 * Dice Space (3-state, scalar selection — noGuess 가드 없음):
 *   confirmOpen → no-op
 *   !commitment → prepare
 *   commitment  → openConfirm
 */
import { describe, it, expect } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { ImportedDiceGame } from "..";
import { makeSurfaceProps } from "@/games/__tests__/contractHelpers";

describe("Dice · shortkeys (Space 3-state)", () => {
  it("Space with no commitment → onPrepareRound", () => {
    const props = makeSurfaceProps("dice", { commitment: null });
    render(<ImportedDiceGame {...props} />);
    fireEvent.keyDown(window, { key: " " });
    expect(props.onPrepareRound).toHaveBeenCalledTimes(1);
    expect(props.onOpenBetConfirm).not.toHaveBeenCalled();
  });

  it("Space after commitment → onOpenBetConfirm (after RG gate)", async () => {
    const props = makeSurfaceProps("dice", {
      commitment: { round_id: "r1", server_seed_hash: "h".repeat(64) },
    });
    render(<ImportedDiceGame {...props} />);
    fireEvent.keyDown(window, { key: " " });
    await waitFor(() =>
      expect(props.onOpenBetConfirm).toHaveBeenCalledTimes(1),
    );
    expect(props.onPrepareRound).not.toHaveBeenCalled();
  });

  it("Space while confirmOpen=true → no-op", () => {
    const props = makeSurfaceProps("dice", {
      commitment: { round_id: "r1", server_seed_hash: "h".repeat(64) },
      confirmOpen: true,
    });
    render(<ImportedDiceGame {...props} />);
    fireEvent.keyDown(window, { key: " " });
    expect(props.onPrepareRound).not.toHaveBeenCalled();
    expect(props.onOpenBetConfirm).not.toHaveBeenCalled();
  });

  it("Esc while confirmOpen=true → onCancelBetConfirm", () => {
    const props = makeSurfaceProps("dice", { confirmOpen: true });
    render(<ImportedDiceGame {...props} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(props.onCancelBetConfirm).toHaveBeenCalledTimes(1);
  });

  it("1/2 → ½ / 2× stake (onStakeChange fires)", () => {
    const props = makeSurfaceProps("dice", {
      stake: "10",
      availableBalance: "10000",
    });
    render(<ImportedDiceGame {...props} />);
    fireEvent.keyDown(window, { key: "1" });
    fireEvent.keyDown(window, { key: "2" });
    expect(props.onStakeChange).toHaveBeenCalled();
  });

  it("5 → MAX stake (capped at availableBalance)", () => {
    const props = makeSurfaceProps("dice", {
      stake: "10",
      availableBalance: "12345",
    });
    render(<ImportedDiceGame {...props} />);
    fireEvent.keyDown(window, { key: "5" });
    expect(props.onStakeChange).toHaveBeenCalledWith("12345");
  });
});
