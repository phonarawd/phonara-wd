/**
 * HiLo · shortkeys integration smoke — Space 4-state caller-side.
 *
 * Renders ImportedHiloGame and exercises useGameShortkeys via real DOM keys.
 * HiLo Space: confirmOpen → no-op, !commitment → prepare,
 *             ready && guesses=[] → no-op, ready && guesses>0 → openConfirm.
 */
import { describe, it, expect } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { ImportedHiloGame } from "..";
import { makeSurfaceProps } from "@/games/__tests__/contractHelpers";

describe("HiLo · shortkeys (Space 4-state)", () => {
  it("Space with no commitment → onPrepareRound", () => {
    const props = makeSurfaceProps("hilo", { commitment: null });
    render(<ImportedHiloGame {...props} />);
    fireEvent.keyDown(window, { key: " " });
    expect(props.onPrepareRound).toHaveBeenCalledTimes(1);
    expect(props.onOpenBetConfirm).not.toHaveBeenCalled();
  });

  it("Space after commitment with guesses → onOpenBetConfirm (after RG gate)", async () => {
    const props = makeSurfaceProps("hilo", {
      commitment: { round_id: "r1", server_seed_hash: "h".repeat(64) },
      selection: { startCard: 5, guesses: ["higher", "higher"] },
    });
    render(<ImportedHiloGame {...props} />);
    fireEvent.keyDown(window, { key: " " });
    await waitFor(() => expect(props.onOpenBetConfirm).toHaveBeenCalledTimes(1));
    expect(props.onPrepareRound).not.toHaveBeenCalled();
  });

  it("Space after commitment with empty guesses → no-op", () => {
    const props = makeSurfaceProps("hilo", {
      commitment: { round_id: "r1", server_seed_hash: "h".repeat(64) },
      selection: { startCard: 5, guesses: [] },
    });
    render(<ImportedHiloGame {...props} />);
    fireEvent.keyDown(window, { key: " " });
    expect(props.onPrepareRound).not.toHaveBeenCalled();
    expect(props.onOpenBetConfirm).not.toHaveBeenCalled();
  });

  it("Space while confirmOpen=true → no-op", () => {
    const props = makeSurfaceProps("hilo", {
      commitment: { round_id: "r1", server_seed_hash: "h".repeat(64) },
      selection: { startCard: 5, guesses: ["higher"] },
      confirmOpen: true,
    });
    render(<ImportedHiloGame {...props} />);
    fireEvent.keyDown(window, { key: " " });
    expect(props.onPrepareRound).not.toHaveBeenCalled();
    expect(props.onOpenBetConfirm).not.toHaveBeenCalled();
  });

  it("Esc while confirmOpen=true → onCancelBetConfirm", () => {
    const props = makeSurfaceProps("hilo", { confirmOpen: true });
    render(<ImportedHiloGame {...props} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(props.onCancelBetConfirm).toHaveBeenCalledTimes(1);
  });

  it("1/2 → ½ / 2× stake (onStakeChange fires)", () => {
    const props = makeSurfaceProps("hilo", { stake: "10", availableBalance: "10000" });
    render(<ImportedHiloGame {...props} />);
    fireEvent.keyDown(window, { key: "1" });
    fireEvent.keyDown(window, { key: "2" });
    expect(props.onStakeChange).toHaveBeenCalled();
  });

  it("5 → MAX stake (capped at availableBalance)", () => {
    const props = makeSurfaceProps("hilo", { stake: "10", availableBalance: "12345" });
    render(<ImportedHiloGame {...props} />);
    fireEvent.keyDown(window, { key: "5" });
    expect(props.onStakeChange).toHaveBeenCalledWith("12345");
  });
});
