/**
 * Mines · MinesAutoSlot — round-trip + single-render contract.
 *
 * Mounts the slot inside the live Mines controls (Auto tab) to prove:
 *   - `casino-auto-slot-mines` is rendered exactly once.
 *   - mineCount chip changes propagate via `onMineCountChange` (which is
 *     wired in Controls to reset `selection.revealedCells = []`).
 *   - revealCount stepper changes round-trip via local state.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

function renderAuto(props: ImportedGameSurfaceProps<"mines">) {
  const utils = render(
    <RGGateProvider>
      <ControlsDesktop {...props} />
    </RGGateProvider>,
  );
  fireEvent.click(screen.getByTestId("casino-bet-mode-auto"));
  return utils;
}

describe("MinesAutoSlot · live render + round-trip", () => {
  it("renders the slot exactly once on the Auto tab", () => {
    renderAuto(makeProps());
    expect(screen.getAllByTestId("casino-auto-slot-mines")).toHaveLength(1);
    expect(screen.getByTestId("casino-auto-reveal")).toBeInTheDocument();
  });

  it("changing mineCount chip propagates via onSelectionChange", () => {
    const props = makeProps();
    renderAuto(props);
    fireEvent.click(screen.getByTestId("casino-auto-mines-5"));
    expect(props.onSelectionChange).toHaveBeenCalledWith(
      expect.objectContaining({ mineCount: 5, revealedCells: [] }),
    );
  });

  it("revealCount stepper round-trips and clamps to 1..(25-mineCount)", () => {
    renderAuto(makeProps());
    const input = screen.getByTestId("casino-auto-reveal") as HTMLInputElement;
    // default is 3
    expect(input.value).toBe("3");

    fireEvent.click(screen.getByTestId("casino-auto-reveal-inc"));
    expect((screen.getByTestId("casino-auto-reveal") as HTMLInputElement).value).toBe(
      "4",
    );

    fireEvent.change(input, { target: { value: "999" } });
    // clamps to 25 - 3 = 22
    expect(
      (screen.getByTestId("casino-auto-reveal") as HTMLInputElement).value,
    ).toBe("22");

    fireEvent.click(screen.getByTestId("casino-auto-reveal-dec"));
    expect(
      (screen.getByTestId("casino-auto-reveal") as HTMLInputElement).value,
    ).toBe("21");
  });

  it("survives Auto → Manual → Auto toggle (slot still mounts)", () => {
    renderAuto(makeProps());
    fireEvent.click(screen.getByTestId("casino-bet-mode-manual"));
    expect(screen.queryByTestId("casino-auto-slot-mines")).toBeNull();
    fireEvent.click(screen.getByTestId("casino-bet-mode-auto"));
    expect(screen.getAllByTestId("casino-auto-slot-mines")).toHaveLength(1);
  });
});
