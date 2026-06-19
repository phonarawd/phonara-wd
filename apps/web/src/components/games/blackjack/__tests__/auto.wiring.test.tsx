/**
 * Blackjack · Auto wiring contract.
 */
import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBlackjackOnPrimary } from "../Controls.shared";
import { RGGateProvider } from "@/games/shared/RGGateProvider";
import type { ImportedGameSurfaceProps } from "@/games/shared/types";

function makeProps(
  overrides: Partial<ImportedGameSurfaceProps<"blackjack">> = {},
): ImportedGameSurfaceProps<"blackjack"> {
  return {
    gameCode: "blackjack",
    currency: "PHON",
    stake: "10",
    selection: { actions: [] },
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

const wrap = ({ children }: { children: React.ReactNode }) => (
  <RGGateProvider>{children}</RGGateProvider>
);

describe("useBlackjackOnPrimary · Auto wiring", () => {
  it("commitment present: onAutoFire → onSubmitBet 1x, onPrepareRound 0x", async () => {
    const props = makeProps({
      commitment: { round_id: "r1", server_seed_hash: "h".repeat(64) },
    });
    const { result } = renderHook(() => useBlackjackOnPrimary(props), { wrapper: wrap });
    await act(async () => { await result.current.onAutoFire(); });
    expect(props.onSubmitBet).toHaveBeenCalledTimes(1);
    expect(props.onPrepareRound).not.toHaveBeenCalled();
  });

  it("no commitment: onAutoFire → onPrepareRound 1x, onSubmitBet 0x", async () => {
    const props = makeProps();
    const { result } = renderHook(() => useBlackjackOnPrimary(props), { wrapper: wrap });
    await act(async () => { await result.current.onAutoFire(); });
    expect(props.onPrepareRound).toHaveBeenCalledTimes(1);
    expect(props.onSubmitBet).not.toHaveBeenCalled();
  });
});
