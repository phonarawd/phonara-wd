/**
 * Plinko · Controls — testid + rows/risk wiring smoke for both wrappers.
 *
 * Phase 3: Controls.shared uses useRGGate, so renders are wrapped in
 * RGGateProvider. The default allow-policy resolves a microtask later,
 * so the onOpenBetConfirm assertion is awaited.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ControlsMobile } from "../Controls.mobile";
import { ControlsDesktop } from "../Controls.desktop";
import { RGGateProvider } from "@/games/shared/RGGateProvider";
import type { ImportedGameSurfaceProps } from "@/games/shared/types";

function makeProps(
  overrides: Partial<ImportedGameSurfaceProps<"plinko">> = {},
): ImportedGameSurfaceProps<"plinko"> {
  return {
    gameCode: "plinko",
    currency: "PHON",
    stake: "10",
    selection: { rows: 8, risk: "low" },
    clientSeed: "deadbeef",
    availableBalance: "10000",
    commitment: null,
    bet: null,
    verification: null,
    recentBets: [],
    busy: false,
    confirmOpen: false,
    onStakeChange: vi.fn(),
    onCurrencyChange: vi.fn(),
    onSelectionChange: vi.fn(),
    onClientSeedChange: vi.fn(),
    onPrepareRound: vi.fn(),
    onOpenBetConfirm: vi.fn(),
    onSubmitBet: vi.fn(),
    onCancelBetConfirm: vi.fn(),
    ...overrides,
  };
}

function renderControls(
  Controls: typeof ControlsMobile,
  props: ImportedGameSurfaceProps<"plinko">,
) {
  return render(
    <RGGateProvider>
      <Controls {...props} />
    </RGGateProvider>,
  );
}

describe.each([
  ["ControlsMobile", ControlsMobile],
  ["ControlsDesktop", ControlsDesktop],
])("%s", (_name, Controls) => {
  it("renders the Lovable-owned testid anchors", () => {
    renderControls(Controls, makeProps());
    expect(screen.getByTestId("casino-stake-input")).toBeInTheDocument();
    expect(screen.getByTestId("casino-place-bet")).toBeInTheDocument();
    expect(screen.getByTestId("casino-prepare-hash")).toBeInTheDocument();
  });

  it("rows picker fires onSelectionChange with new rows", () => {
    const props = makeProps();
    renderControls(Controls, props);
    fireEvent.click(screen.getByRole("button", { name: "16" }));
    expect(props.onSelectionChange).toHaveBeenCalledWith(
      expect.objectContaining({ rows: 16, risk: "low" }),
    );
  });

  it("risk picker fires onSelectionChange with new risk", () => {
    const props = makeProps();
    renderControls(Controls, props);
    fireEvent.click(screen.getByRole("button", { name: /high/i }));
    expect(props.onSelectionChange).toHaveBeenCalledWith(
      expect.objectContaining({ rows: 8, risk: "high" }),
    );
  });

  it("primary CTA routes through onPrepareRound when no commitment", () => {
    const props = makeProps();
    renderControls(Controls, props);
    fireEvent.click(screen.getByTestId("casino-place-bet"));
    expect(props.onPrepareRound).toHaveBeenCalled();
  });

  it("primary CTA routes through onOpenBetConfirm once commitment exists (after RG gate)", async () => {
    const props = makeProps({
      commitment: { round_id: "r1", server_seed_hash: "h".repeat(64) },
    });
    renderControls(Controls, props);
    fireEvent.click(screen.getByTestId("casino-place-bet"));
    await waitFor(() => expect(props.onOpenBetConfirm).toHaveBeenCalledTimes(1));
  });
});
