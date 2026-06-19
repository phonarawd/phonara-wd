/**
 * Dice · Controls — testid + callback wiring smoke for both wrappers.
 *
 * Phase 5 v1 RED LOCK v3.1: primary CTA on ready path awaits
 * `useRGGate().gate("place_bet")` before opening confirm.
 * Wrapped in `<RGGateProvider>` (default policy = allow).
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ControlsMobile } from "../Controls.mobile";
import { ControlsDesktop } from "../Controls.desktop";
import { RGGateProvider } from "@/games/shared/RGGateProvider";
import type { ImportedGameSurfaceProps } from "@/games/shared/types";

function makeProps(
  overrides: Partial<ImportedGameSurfaceProps<"dice">> = {},
): ImportedGameSurfaceProps<"dice"> {
  return {
    gameCode: "dice",
    currency: "PHON",
    stake: "10",
    selection: { target: "50.00", direction: "over" },
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

describe.each([
  ["ControlsMobile", ControlsMobile],
  ["ControlsDesktop", ControlsDesktop],
])("%s", (_name, Controls) => {
  it("renders the Lovable-owned testid anchors", () => {
    render(
      <RGGateProvider>
        <Controls {...makeProps()} />
      </RGGateProvider>,
    );
    expect(screen.getByTestId("casino-stake-input")).toBeInTheDocument();
    expect(screen.getByTestId("casino-place-bet")).toBeInTheDocument();
    expect(screen.getByTestId("casino-prepare-hash")).toBeInTheDocument();
  });

  it("secondary CTA label is '해시 커밋'", () => {
    render(
      <RGGateProvider>
        <Controls {...makeProps()} />
      </RGGateProvider>,
    );
    expect(screen.getByTestId("casino-prepare-hash")).toHaveTextContent(
      "해시 커밋",
    );
  });

  it("fires onPrepareRound from the secondary CTA", () => {
    const props = makeProps();
    render(
      <RGGateProvider>
        <Controls {...props} />
      </RGGateProvider>,
    );
    fireEvent.click(screen.getByTestId("casino-prepare-hash"));
    expect(props.onPrepareRound).toHaveBeenCalledTimes(1);
  });

  it("primary CTA routes through onPrepareRound when no commitment", () => {
    const props = makeProps();
    render(
      <RGGateProvider>
        <Controls {...props} />
      </RGGateProvider>,
    );
    fireEvent.click(screen.getByTestId("casino-place-bet"));
    expect(props.onPrepareRound).toHaveBeenCalled();
  });

  it("primary CTA awaits RG gate then routes through onOpenBetConfirm once commitment exists", async () => {
    const props = makeProps({
      commitment: { round_id: "r1", server_seed_hash: "h".repeat(64) },
    });
    render(
      <RGGateProvider>
        <Controls {...props} />
      </RGGateProvider>,
    );
    fireEvent.click(screen.getByTestId("casino-place-bet"));
    await waitFor(() =>
      expect(props.onOpenBetConfirm).toHaveBeenCalledTimes(1),
    );
  });

  it("renders AutoBet reset/increase mode toggles (P2.0b)", () => {
    render(
      <RGGateProvider>
        <Controls {...makeProps()} />
      </RGGateProvider>,
    );
    fireEvent.click(screen.getByTestId("casino-bet-mode-auto"));
    expect(screen.getByTestId("autobet-on-win-mode-reset")).toBeInTheDocument();
    expect(screen.getByTestId("autobet-on-win-mode-increase")).toBeInTheDocument();
    expect(screen.getByTestId("autobet-on-loss-mode-reset")).toBeInTheDocument();
    expect(screen.getByTestId("autobet-on-loss-mode-increase")).toBeInTheDocument();
  });
});
