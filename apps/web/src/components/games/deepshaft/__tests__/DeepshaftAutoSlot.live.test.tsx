/**
 * Deepshaft · DeepshaftAutoSlot — LIVE dual-viewport proof (G#10).
 *
 * Limbo lesson: vitest-only round-trip is NOT enough; the slot must
 * actually mount on BOTH live Controls surfaces (1280 desktop + 390
 * mobile). This sibling test mounts the live ControlsDesktop AND
 * ControlsMobile under RGGateProvider and asserts:
 *   - `casino-auto-slot-deepshaft` count === 1 on each surface.
 *   - riskTier chip + targetDepth stepper round-trip via local state.
 *   - Auto → Manual → Auto toggle re-mounts the slot (no loss).
 *
 * LAW 4 / engine: untouched (this test never inspects bet.result).
 */
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { ControlsDesktop } from "../Controls.desktop";
import { ControlsMobile } from "../Controls.mobile";
import { RGGateProvider } from "@/games/shared/RGGateProvider";
import type { ImportedGameSurfaceProps } from "@/games/shared/types";

type Surface = typeof ControlsDesktop | typeof ControlsMobile;

/** Controlled host — propagates onSelectionChange so the slot round-trips. */
function Host({ Surface }: { Surface: Surface }) {
  const [selection, setSelection] = useState<
    ImportedGameSurfaceProps<"deepshaft">["selection"]
  >({ riskTier: "standard", targetDepth: 5 });

  const props: ImportedGameSurfaceProps<"deepshaft"> = {
    gameCode: "deepshaft",
    currency: "PHON",
    stake: "10",
    selection,
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
    onSelectionChange: (s) => setSelection(s),
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
] as const)("DeepshaftAutoSlot · LIVE %s", (_label, Surface) => {
  it("renders the slot exactly once on the Auto tab", () => {
    mountSurface(Surface);
    expect(screen.getAllByTestId("casino-auto-slot-deepshaft")).toHaveLength(1);
    expect(screen.getByTestId("casino-auto-deepshaft-depth")).toBeInTheDocument();
    expect(screen.getByTestId("casino-auto-deepshaft-tier-standard")).toBeInTheDocument();
  });

  it("riskTier chip round-trips via aria-pressed", () => {
    mountSurface(Surface);
    const slot = screen.getByTestId("casino-auto-slot-deepshaft");
    const deep = within(slot).getByTestId("casino-auto-deepshaft-tier-deep");
    fireEvent.click(deep);
    expect(deep.getAttribute("aria-pressed")).toBe("true");
    const safe = within(slot).getByTestId("casino-auto-deepshaft-tier-safe");
    fireEvent.click(safe);
    expect(safe.getAttribute("aria-pressed")).toBe("true");
    expect(deep.getAttribute("aria-pressed")).toBe("false");
  });

  it("targetDepth stepper round-trips and clamps to 1..15", () => {
    mountSurface(Surface);
    const input = screen.getByTestId(
      "casino-auto-deepshaft-depth",
    ) as HTMLInputElement;
    expect(input.value).toBe("5");

    fireEvent.click(screen.getByTestId("casino-auto-deepshaft-depth-inc"));
    expect(
      (screen.getByTestId("casino-auto-deepshaft-depth") as HTMLInputElement).value,
    ).toBe("6");

    fireEvent.change(input, { target: { value: "999" } });
    expect(
      (screen.getByTestId("casino-auto-deepshaft-depth") as HTMLInputElement).value,
    ).toBe("15");

    fireEvent.change(
      screen.getByTestId("casino-auto-deepshaft-depth") as HTMLInputElement,
      { target: { value: "0" } },
    );
    expect(
      (screen.getByTestId("casino-auto-deepshaft-depth") as HTMLInputElement).value,
    ).toBe("1");
  });

  it("survives Auto → Manual → Auto toggle (slot re-mounts cleanly)", () => {
    mountSurface(Surface);
    fireEvent.click(screen.getByTestId("casino-bet-mode-manual"));
    expect(screen.queryByTestId("casino-auto-slot-deepshaft")).toBeNull();
    fireEvent.click(screen.getByTestId("casino-bet-mode-auto"));
    expect(screen.getAllByTestId("casino-auto-slot-deepshaft")).toHaveLength(1);
  });
});
