/**
 * CrashGame — frozen-contract test.
 *
 * Verifies the PHONARA `ImportedGameSurfaceProps` wiring without touching
 * visuals: required testid anchors are present, selection callback fires
 * on auto-cashout edit, prepare/place callbacks wire to the two CTAs.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ImportedCrashGame as CrashGame } from "../index";
import type { ImportedGameSurfaceProps } from "@/games/shared/types";

function makeProps(
  overrides: Partial<ImportedGameSurfaceProps<"crash">> = {},
): ImportedGameSurfaceProps<"crash"> {
  return {
    gameCode: "crash",
    currency: "PHON",
    stake: "10",
    selection: { autoCashout: "2.00" },
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

describe("CrashGame — frozen contract", () => {
  it("renders the Lovable-owned PHONARA testid anchors visible on first paint", () => {
    render(<CrashGame {...makeProps()} />);
    // Lovable surface owns 5 of 9 testids. casino-client-seed-input lives
    // inside the (collapsed) FairnessSheet and is asserted by the E2E
    // suite after opening the trigger; the remaining 4 (fairness-verifier,
    // bet-confirm{,-confirm,-cancel}) are injected by the Cursor adapter
    // at paste time and NOT asserted here.
    expect(screen.getByTestId("casino-stake-input")).toBeInTheDocument();
    expect(screen.getByTestId("casino-place-bet")).toBeInTheDocument();
    expect(screen.getByTestId("casino-prepare-hash")).toBeInTheDocument();
  });

  it("calls onPrepareRound when the prepare CTA is pressed", () => {
    const props = makeProps();
    render(<CrashGame {...props} />);
    fireEvent.click(screen.getByTestId("casino-prepare-hash"));
    expect(props.onPrepareRound).toHaveBeenCalledTimes(1);
  });

  it("calls onPrepareRound from the primary CTA when no commitment exists", () => {
    const props = makeProps({ commitment: null });
    render(<CrashGame {...props} />);
    fireEvent.click(screen.getByTestId("casino-place-bet"));
    expect(props.onPrepareRound).toHaveBeenCalled();
  });

  it("calls onOpenBetConfirm from the primary CTA once a commitment exists (after RG gate)", async () => {
    const props = makeProps({
      commitment: { round_id: "r1", server_seed_hash: "h".repeat(64) },
    });
    render(<CrashGame {...props} />);
    fireEvent.click(screen.getByTestId("casino-place-bet"));
    await waitFor(() => expect(props.onOpenBetConfirm).toHaveBeenCalledTimes(1));
  });

  it("emits onSelectionChange with a clean autoCashout when edited", () => {
    const props = makeProps();
    render(<CrashGame {...props} />);
    const auto = screen.getByLabelText(/자동 캐시아웃/);
    fireEvent.change(auto, { target: { value: "3.50x" } });
    expect(props.onSelectionChange).toHaveBeenCalledWith({ autoCashout: "3.50" });
  });

  it("emits onStakeChange when the stake input changes", () => {
    const props = makeProps();
    render(<CrashGame {...props} />);
    fireEvent.change(screen.getByTestId("casino-stake-input"), {
      target: { value: "25" },
    });
    expect(props.onStakeChange).toHaveBeenCalled();
  });

  it("disables the primary CTA while busy", () => {
    render(<CrashGame {...makeProps({ busy: true })} />);
    expect(screen.getByTestId("casino-place-bet")).toBeDisabled();
  });
});
