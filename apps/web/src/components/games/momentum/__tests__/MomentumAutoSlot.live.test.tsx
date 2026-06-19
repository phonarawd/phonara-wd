/**
 * Momentum · MomentumAutoSlot — LIVE dual-viewport proof (G#11).
 *
 * Mirrors Deepshaft DeepshaftAutoSlot.live.test pattern. Mounts the
 * live ControlsDesktop AND ControlsMobile under RGGateProvider and
 * asserts that the typed slot mounts EXACTLY ONCE per surface, that
 * the policy chips round-trip via local state, and that
 * Auto → Manual → Auto re-mounts the slot.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { ControlsDesktop } from "../Controls.desktop";
import { ControlsMobile } from "../Controls.mobile";
import { RGGateProvider } from "@/games/shared/RGGateProvider";
import type { MomentumSurfaceProps } from "../types";

type Surface = typeof ControlsDesktop | typeof ControlsMobile;

function Host({ Surface }: { Surface: Surface }) {
  const props: MomentumSurfaceProps = {
    gameCode: "momentum",
    currency: "PHON",
    stake: "10",
    selection: { comboBefore: 0, cashOut: false },
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
  };
  return <Surface {...props} />;
}

function mountSurface(Surface: Surface) {
  const utils = render(
    <RGGateProvider>
      <Host Surface={Surface} />
    </RGGateProvider>,
  );
  fireEvent.click(screen.getByTestId("casino-bet-mode-auto"));
  return utils;
}

describe.each([
  ["desktop (1280)", ControlsDesktop],
  ["mobile (390)", ControlsMobile],
] as const)("MomentumAutoSlot · LIVE %s", (_label, Surface) => {
  it("renders the slot exactly once on the Auto tab", () => {
    mountSurface(Surface);
    expect(screen.getAllByTestId("casino-auto-slot-momentum")).toHaveLength(1);
    expect(screen.getByTestId("casino-auto-momentum-policy-early")).toBeInTheDocument();
    expect(screen.getByTestId("casino-auto-momentum-policy-mid")).toBeInTheDocument();
    expect(screen.getByTestId("casino-auto-momentum-policy-greedy")).toBeInTheDocument();
  });

  it("policy chip round-trips via aria-pressed", () => {
    mountSurface(Surface);
    const slot = screen.getByTestId("casino-auto-slot-momentum");
    const greedy = within(slot).getByTestId("casino-auto-momentum-policy-greedy");
    fireEvent.click(greedy);
    expect(greedy.getAttribute("aria-pressed")).toBe("true");
    const early = within(slot).getByTestId("casino-auto-momentum-policy-early");
    fireEvent.click(early);
    expect(early.getAttribute("aria-pressed")).toBe("true");
    expect(greedy.getAttribute("aria-pressed")).toBe("false");
  });

  it("survives Auto → Manual → Auto toggle (slot re-mounts cleanly)", () => {
    mountSurface(Surface);
    fireEvent.click(screen.getByTestId("casino-bet-mode-manual"));
    expect(screen.queryByTestId("casino-auto-slot-momentum")).toBeNull();
    fireEvent.click(screen.getByTestId("casino-bet-mode-auto"));
    expect(screen.getAllByTestId("casino-auto-slot-momentum")).toHaveLength(1);
  });
});
