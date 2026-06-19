/**
 * LimboGame — frozen-contract test.
 *
 * Phase 4 v1.3: surface wraps RGGateProvider; the ready→openConfirm
 * path awaits the gate microtask, so its assertion uses waitFor.
 * Verifies PHONARA `ImportedGameSurfaceProps` wiring without touching
 * visuals. Uses the back-compat alias `LimboGame` which is re-exported
 * from `ImportedLimboGame` per PHONARA registry contract.
 */
import { describe, expect, it } from "vitest";
import { render, screen, fireEvent as evt, waitFor } from "@testing-library/react";
import { LimboGame } from "../index";
import { makeSurfaceProps } from "@/games/__tests__/contractHelpers";

describe("LimboGame — frozen contract", () => {
  it("renders the required PHONARA testid anchors (first paint)", () => {
    render(<LimboGame {...makeSurfaceProps("limbo")} />);
    expect(screen.getByTestId("casino-stake-input")).toBeInTheDocument();
    expect(screen.getByTestId("casino-place-bet")).toBeInTheDocument();
    expect(screen.getByTestId("casino-prepare-hash")).toBeInTheDocument();
  });

  it("PF Sheet open → casino-fairness-verifier + casino-client-seed-input attached (after-flow)", () => {
    render(<LimboGame {...makeSurfaceProps("limbo")} />);
    // Sanity: not attached on first paint.
    expect(screen.queryByTestId("casino-fairness-verifier")).toBeNull();
    expect(screen.queryByTestId("casino-client-seed-input")).toBeNull();
    evt.click(screen.getByRole("button", { name: /provably fair/i }));
    expect(screen.getByTestId("casino-fairness-verifier")).toBeInTheDocument();
    expect(screen.getByTestId("casino-client-seed-input")).toBeInTheDocument();
  });

  it("BetConfirm trio attached only while confirmOpen=true (after-flow)", () => {
    render(<LimboGame {...makeSurfaceProps("limbo", { confirmOpen: false })} />);
    expect(screen.queryByTestId("casino-bet-confirm")).toBeNull();
    expect(screen.queryByTestId("casino-bet-confirm-confirm")).toBeNull();
    expect(screen.queryByTestId("casino-bet-confirm-cancel")).toBeNull();

    render(<LimboGame {...makeSurfaceProps("limbo", { confirmOpen: true })} />);
    expect(screen.getByTestId("casino-bet-confirm")).toBeInTheDocument();
    expect(screen.getByTestId("casino-bet-confirm-confirm")).toBeInTheDocument();
    expect(screen.getByTestId("casino-bet-confirm-cancel")).toBeInTheDocument();
  });

  it("calls onPrepareRound when the prepare CTA is pressed", () => {
    const props = makeSurfaceProps("limbo");
    render(<LimboGame {...props} />);
    evt.click(screen.getByTestId("casino-prepare-hash"));
    expect(props.onPrepareRound).toHaveBeenCalledTimes(1);
  });

  it("calls onPrepareRound from the primary CTA when no commitment exists", () => {
    const props = makeSurfaceProps("limbo", { commitment: null });
    render(<LimboGame {...props} />);
    evt.click(screen.getByTestId("casino-place-bet"));
    expect(props.onPrepareRound).toHaveBeenCalled();
  });

  it("calls onOpenBetConfirm from the primary CTA once a commitment exists (after RG gate)", async () => {
    const props = makeSurfaceProps("limbo", {
      commitment: { round_id: "r1", server_seed_hash: "h".repeat(64) },
    });
    render(<LimboGame {...props} />);
    evt.click(screen.getByTestId("casino-place-bet"));
    await waitFor(() => expect(props.onOpenBetConfirm).toHaveBeenCalledTimes(1));
  });

  it("emits onStakeChange when the stake input changes", () => {
    const props = makeSurfaceProps("limbo");
    render(<LimboGame {...props} />);
    evt.change(screen.getByTestId("casino-stake-input"), { target: { value: "25" } });
    expect(props.onStakeChange).toHaveBeenCalled();
  });

  it("emits onSelectionChange with a sanitized target string (UI refine — Number>=1.01 is Lovable-only)", () => {
    const props = makeSurfaceProps("limbo");
    render(<LimboGame {...props} />);
    evt.change(screen.getByPlaceholderText("2.00"), { target: { value: "abc3.50" } });
    expect(props.onSelectionChange).toHaveBeenCalledWith({ target: "3.50" });
  });

  it("disables the primary CTA while busy", () => {
    render(<LimboGame {...makeSurfaceProps("limbo", { busy: true })} />);
    expect(screen.getByTestId("casino-place-bet")).toBeDisabled();
  });
});
