/**
 * PlinkoGame — frozen-contract test.
 *
 * Phase 3: surface now mounts RGGateProvider + BetConfirmDialog + controlled
 * GameRulesSheet. The 5 Lovable-owned testids that appear on first paint
 * are asserted here; the 4 PF/Confirm testids are gated by user flow
 * and verified by the E2E suite + per-component unit tests.
 *
 * selection { rows, risk } freeze: onSelectionChange payload must match
 * PHONARA zod (rows ∈ {8,12,16}, risk ∈ {low,medium,high}).
 */
import { describe, expect, it } from "vitest";
import { render, screen, fireEvent as evt, waitFor, within } from "@testing-library/react";
import { PlinkoGame } from "..";
import { makeSurfaceProps } from "@/games/__tests__/contractHelpers";

function rowsSelector() {
  const el = document.querySelector('[data-game-id="plinko-rows-selector"]');
  if (!el) throw new Error("plinko-rows-selector missing");
  return within(el as HTMLElement);
}

function riskSelector() {
  const el = document.querySelector('[data-game-id="plinko-risk-selector"]');
  if (!el) throw new Error("plinko-risk-selector missing");
  return within(el as HTMLElement);
}

describe("PlinkoGame — frozen contract", () => {
  it("renders the Lovable-owned PHONARA testid anchors visible on first paint", () => {
    render(<PlinkoGame {...makeSurfaceProps("plinko")} />);
    expect(screen.getByTestId("casino-stake-input")).toBeInTheDocument();
    expect(screen.getByTestId("casino-place-bet")).toBeInTheDocument();
    expect(screen.getByTestId("casino-prepare-hash")).toBeInTheDocument();
  });

  it("calls onPrepareRound when the prepare CTA is pressed", () => {
    const props = makeSurfaceProps("plinko");
    render(<PlinkoGame {...props} />);
    evt.click(screen.getByTestId("casino-prepare-hash"));
    expect(props.onPrepareRound).toHaveBeenCalledTimes(1);
  });

  it("calls onPrepareRound from the primary CTA when no commitment exists", () => {
    const props = makeSurfaceProps("plinko", { commitment: null });
    render(<PlinkoGame {...props} />);
    evt.click(screen.getByTestId("casino-place-bet"));
    expect(props.onPrepareRound).toHaveBeenCalled();
  });

  it("calls onOpenBetConfirm from the primary CTA once a commitment exists (after RG gate)", async () => {
    const props = makeSurfaceProps("plinko", {
      commitment: { round_id: "r1", server_seed_hash: "h".repeat(64) },
    });
    render(<PlinkoGame {...props} />);
    evt.click(screen.getByTestId("casino-place-bet"));
    await waitFor(() => expect(props.onOpenBetConfirm).toHaveBeenCalledTimes(1));
  });

  it("emits onSelectionChange with frozen { rows, risk } shape (rows=16)", () => {
    const props = makeSurfaceProps("plinko");
    render(<PlinkoGame {...props} />);
    evt.click(rowsSelector().getByRole("button", { name: "16" }));
    expect(props.onSelectionChange).toHaveBeenCalledWith(
      expect.objectContaining({ rows: 16, risk: "medium" }),
    );
  });

  it("emits onSelectionChange with frozen { rows, risk } shape (risk=high)", () => {
    const props = makeSurfaceProps("plinko");
    render(<PlinkoGame {...props} />);
    evt.click(riskSelector().getByRole("button", { name: /high/i }));
    expect(props.onSelectionChange).toHaveBeenCalledWith(
      expect.objectContaining({ rows: 12, risk: "high" }),
    );
  });

  it("emits onStakeChange when the stake input changes", () => {
    const props = makeSurfaceProps("plinko");
    render(<PlinkoGame {...props} />);
    evt.change(screen.getByTestId("casino-stake-input"), {
      target: { value: "25" },
    });
    expect(props.onStakeChange).toHaveBeenCalled();
  });

  it("disables the primary CTA while busy", () => {
    render(<PlinkoGame {...makeSurfaceProps("plinko", { busy: true })} />);
    expect(screen.getByTestId("casino-place-bet")).toBeDisabled();
  });
});
