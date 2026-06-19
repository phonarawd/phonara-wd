/**
 * Mines · Controls — testid + mineCount wiring smoke for both wrappers.
 *
 * Phase 5 v1: Controls.shared uses useRGGate, so renders wrap in
 * RGGateProvider. The default allow-policy resolves a microtask later,
 * so any onOpenBetConfirm assertion would be awaited.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ControlsMobile } from "../Controls.mobile";
import { ControlsDesktop } from "../Controls.desktop";
import { RGGateProvider } from "@/games/shared/RGGateProvider";
import type { ImportedGameSurfaceProps } from "@/games/shared/types";

function makeProps(
  overrides: Partial<ImportedGameSurfaceProps<"mines">> = {},
): ImportedGameSurfaceProps<"mines"> {
  return {
    gameCode: "mines",
    currency: "PHON",
    stake: "10",
    selection: { mineCount: 3, revealedCells: [] },
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
  props: ImportedGameSurfaceProps<"mines">,
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

  it("changing mine count fires onSelectionChange with revealedCells reset", () => {
    const props = makeProps({
      selection: { mineCount: 3, revealedCells: [0, 1, 2] },
    });
    renderControls(Controls, props);
    fireEvent.click(screen.getByRole("button", { name: "5" }));
    expect(props.onSelectionChange).toHaveBeenCalledWith(
      expect.objectContaining({ mineCount: 5, revealedCells: [] }),
    );
  });

  it("primary CTA routes through onPrepareRound when no commitment", () => {
    const props = makeProps();
    renderControls(Controls, props);
    fireEvent.click(screen.getByTestId("casino-place-bet"));
    expect(props.onPrepareRound).toHaveBeenCalled();
  });
});
