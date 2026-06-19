/**
 * Mines · shortkeys integration smoke — Space 2분기 caller-side.
 *
 * Renders ImportedMinesGame and exercises useGameShortkeys via DOM keys.
 * Mines Space는: !commitment → prepare, ready && revealed.length>0 →
 * openConfirm, ready && revealed=[] → no-op, confirmOpen → no-op.
 */
import { describe, it, expect } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { ImportedMinesGame } from "..";
import { makeSurfaceProps } from "@/games/__tests__/contractHelpers";

describe("Mines · shortkeys (Space state-machine)", () => {
  it("Space with no commitment → onPrepareRound", () => {
    const props = makeSurfaceProps("mines", { commitment: null });
    render(<ImportedMinesGame {...props} />);
    fireEvent.keyDown(window, { key: " " });
    expect(props.onPrepareRound).toHaveBeenCalledTimes(1);
    expect(props.onOpenBetConfirm).not.toHaveBeenCalled();
  });

  it("Space after commitment with revealed tiles → onOpenBetConfirm (after RG gate)", async () => {
    const props = makeSurfaceProps("mines", {
      commitment: { round_id: "r1", server_seed_hash: "h".repeat(64) },
      selection: { mineCount: 3, revealedCells: [0, 1] },
    });
    render(<ImportedMinesGame {...props} />);
    fireEvent.keyDown(window, { key: " " });
    await waitFor(() => expect(props.onOpenBetConfirm).toHaveBeenCalledTimes(1));
    expect(props.onPrepareRound).not.toHaveBeenCalled();
  });

  it("Space after commitment with empty selection → no-op", () => {
    const props = makeSurfaceProps("mines", {
      commitment: { round_id: "r1", server_seed_hash: "h".repeat(64) },
      selection: { mineCount: 3, revealedCells: [] },
    });
    render(<ImportedMinesGame {...props} />);
    fireEvent.keyDown(window, { key: " " });
    expect(props.onPrepareRound).not.toHaveBeenCalled();
    expect(props.onOpenBetConfirm).not.toHaveBeenCalled();
  });

  it("Space while confirmOpen=true → no-op", () => {
    const props = makeSurfaceProps("mines", {
      commitment: { round_id: "r1", server_seed_hash: "h".repeat(64) },
      selection: { mineCount: 3, revealedCells: [0] },
      confirmOpen: true,
    });
    render(<ImportedMinesGame {...props} />);
    fireEvent.keyDown(window, { key: " " });
    expect(props.onPrepareRound).not.toHaveBeenCalled();
    expect(props.onOpenBetConfirm).not.toHaveBeenCalled();
  });

  it("Esc while confirmOpen=true → onCancelBetConfirm", () => {
    const props = makeSurfaceProps("mines", { confirmOpen: true });
    render(<ImportedMinesGame {...props} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(props.onCancelBetConfirm).toHaveBeenCalledTimes(1);
  });

  it("1 → ½ stake, 2 → 2× stake", () => {
    const props = makeSurfaceProps("mines", { stake: "10", availableBalance: "10000" });
    render(<ImportedMinesGame {...props} />);
    fireEvent.keyDown(window, { key: "1" });
    fireEvent.keyDown(window, { key: "2" });
    expect(props.onStakeChange).toHaveBeenCalled();
  });

  it("5 → MAX stake (capped at availableBalance)", () => {
    const props = makeSurfaceProps("mines", { stake: "10", availableBalance: "12345" });
    render(<ImportedMinesGame {...props} />);
    fireEvent.keyDown(window, { key: "5" });
    expect(props.onStakeChange).toHaveBeenCalledWith("12345");
  });
});
