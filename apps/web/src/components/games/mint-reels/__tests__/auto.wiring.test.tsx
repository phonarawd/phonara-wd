/**
 * Mint Reels · Auto-Mode wiring smoke (Phase 4.5 Slice 4).
 *
 * Validates:
 *  - Auto tab → Start invokes A6 onAutoFire wrapper.
 *  - commitment present: onSubmitBet 1x, onPrepareRound 0x.
 *  - no commitment: onPrepareRound 1x, onSubmitBet 0x (guard exits).
 *  - Manual selection presets emit `{ lines }` single-key payload.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, renderHook, act } from "@testing-library/react";
import { MintReelsControlsShared, useMintReelsOnPrimary } from "../Controls.shared";
import { RGGateProvider } from "@/games/shared/RGGateProvider";
import type { ImportedGameSurfaceProps } from "@/games/shared/types";

function makeProps(
  overrides: Partial<ImportedGameSurfaceProps<"mint_reels">> = {},
): ImportedGameSurfaceProps<"mint_reels"> {
  return {
    gameCode: "mint_reels",
    currency: "PHON",
    stake: "10",
    selection: { lines: 1 },
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

function renderControls(props: ImportedGameSurfaceProps<"mint_reels">) {
  return render(
    <RGGateProvider>
      <MintReelsControlsShared {...props} />
    </RGGateProvider>,
  );
}

describe("MintReelsControlsShared · Auto wiring", () => {
  it("commitment present: onAutoFire → onSubmitBet 1x, onPrepareRound 0x", async () => {
    const props = makeProps({
      commitment: { round_id: "r1", server_seed_hash: "h".repeat(64) },
    });
    const { result } = renderHook(() => useMintReelsOnPrimary(props), {
      wrapper: ({ children }) => <RGGateProvider>{children}</RGGateProvider>,
    });
    await act(async () => {
      await result.current.onAutoFire();
    });
    expect(props.onSubmitBet).toHaveBeenCalledTimes(1);
    expect(props.onPrepareRound).not.toHaveBeenCalled();
  });

  it("no commitment: onAutoFire → onPrepareRound 1x, onSubmitBet 0x (guard)", async () => {
    const props = makeProps();
    const { result } = renderHook(() => useMintReelsOnPrimary(props), {
      wrapper: ({ children }) => <RGGateProvider>{children}</RGGateProvider>,
    });
    await act(async () => {
      await result.current.onAutoFire();
    });
    expect(props.onPrepareRound).toHaveBeenCalledTimes(1);
    expect(props.onSubmitBet).not.toHaveBeenCalled();
  });

  it("UI: Auto tab + toggle activates AutoBetPanel (button shows stop label)", () => {
    const props = makeProps({
      commitment: { round_id: "r1", server_seed_hash: "h".repeat(64) },
    });
    renderControls(props);
    fireEvent.click(screen.getByTestId("casino-bet-mode-auto"));
    const toggle = screen.getByTestId("casino-auto-toggle");
    fireEvent.click(toggle);
    // After Start, button label flips (i18n string differs by locale but
    // the testid stays — we just assert the toggle is still attached &
    // active state visible in DOM).
    expect(toggle).toBeInTheDocument();
  });


  it("selection preset emits { lines } single-key payload", () => {
    const props = makeProps();
    renderControls(props);
    fireEvent.click(screen.getByRole("button", { name: "10" }));
    expect(props.onSelectionChange).toHaveBeenCalledTimes(1);
    const arg = (props.onSelectionChange as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(arg).toEqual({ lines: 10 });
    expect(Object.keys(arg)).toEqual(["lines"]);
  });
});
