/**
 * Plinko · shortkeys integration smoke — Space 3분기 caller-side.
 *
 * Renders ImportedPlinkoGame and exercises the hook via real DOM keys.
 * Generic key→handler mapping is covered by
 * `src/hooks/__tests__/useGameShortkeys.test.tsx`.
 */
import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { ImportedPlinkoGame } from "..";
import { makeSurfaceProps } from "@/games/__tests__/contractHelpers";

describe("Plinko · shortkeys (Space state-machine)", () => {
  it("Space with no commitment → onPrepareRound", () => {
    const props = makeSurfaceProps("plinko", { commitment: null });
    render(<ImportedPlinkoGame {...props} />);
    fireEvent.keyDown(window, { key: " " });
    expect(props.onPrepareRound).toHaveBeenCalledTimes(1);
    expect(props.onOpenBetConfirm).not.toHaveBeenCalled();
  });

  it("Space after commitment → onOpenBetConfirm", () => {
    const props = makeSurfaceProps("plinko", {
      commitment: { round_id: "r1", server_seed_hash: "h".repeat(64) },
    });
    render(<ImportedPlinkoGame {...props} />);
    fireEvent.keyDown(window, { key: " " });
    expect(props.onOpenBetConfirm).toHaveBeenCalledTimes(1);
    expect(props.onPrepareRound).not.toHaveBeenCalled();
  });

  it("Space while confirmOpen=true → no-op (state-machine 3rd branch)", () => {
    const props = makeSurfaceProps("plinko", {
      commitment: { round_id: "r1", server_seed_hash: "h".repeat(64) },
      confirmOpen: true,
    });
    render(<ImportedPlinkoGame {...props} />);
    fireEvent.keyDown(window, { key: " " });
    expect(props.onPrepareRound).not.toHaveBeenCalled();
    expect(props.onOpenBetConfirm).not.toHaveBeenCalled();
  });

  it("Esc while confirmOpen=true → onCancelBetConfirm", () => {
    const props = makeSurfaceProps("plinko", { confirmOpen: true });
    render(<ImportedPlinkoGame {...props} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(props.onCancelBetConfirm).toHaveBeenCalledTimes(1);
  });

  it("1 → ½ stake, 2 → 2× stake (onStakeChange fires)", () => {
    const props = makeSurfaceProps("plinko", { stake: "10", availableBalance: "10000" });
    render(<ImportedPlinkoGame {...props} />);
    fireEvent.keyDown(window, { key: "1" });
    fireEvent.keyDown(window, { key: "2" });
    expect(props.onStakeChange).toHaveBeenCalled();
  });

  it("5 → MAX stake (capped at availableBalance)", () => {
    const props = makeSurfaceProps("plinko", { stake: "10", availableBalance: "12345" });
    render(<ImportedPlinkoGame {...props} />);
    fireEvent.keyDown(window, { key: "5" });
    expect(props.onStakeChange).toHaveBeenCalledWith("12345");
  });
});
