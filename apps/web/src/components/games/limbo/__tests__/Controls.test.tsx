/**
 * Limbo · Controls — testid + primary/secondary wiring smoke for both wrappers.
 *
 * Phase 4 v1.3: Controls.shared uses useRGGate, so renders wrap in
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
  overrides: Partial<ImportedGameSurfaceProps<"limbo">> = {},
): ImportedGameSurfaceProps<"limbo"> {
  return {
    gameCode: "limbo",
    currency: "PHON",
    stake: "10",
    selection: { target: "2.00" },
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
  props: ImportedGameSurfaceProps<"limbo">,
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

  it("stake input emits onStakeChange as string", () => {
    const props = makeProps();
    renderControls(Controls, props);
    fireEvent.change(screen.getByTestId("casino-stake-input"), { target: { value: "25" } });
    expect(props.onStakeChange).toHaveBeenCalled();
  });

  it("disables primary CTA while busy", () => {
    renderControls(Controls, makeProps({ busy: true }));
    expect(screen.getByTestId("casino-place-bet")).toBeDisabled();
  });

  it("renders AutoBet reset/increase mode toggles (P2.0b)", () => {
    renderControls(Controls, makeProps());
    fireEvent.click(screen.getByTestId("casino-bet-mode-auto"));
    expect(screen.getByTestId("autobet-on-win-mode-reset")).toBeInTheDocument();
    expect(screen.getByTestId("autobet-on-win-mode-increase")).toBeInTheDocument();
    expect(screen.getByTestId("autobet-on-loss-mode-reset")).toBeInTheDocument();
    expect(screen.getByTestId("autobet-on-loss-mode-increase")).toBeInTheDocument();
  });
});
