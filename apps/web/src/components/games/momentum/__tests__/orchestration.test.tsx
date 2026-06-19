/**
 * Momentum · combo orchestration (4 cases).
 *
 * Validates that engine truth (bet.result) drives the Stage and that
 * the totalMultiplier banner is gated by `cashedOut === true`. The
 * mock pipeline returns FIXTURES only — no computation.
 *
 * Play path uses a staged roll-reveal (LAW 4, ≤900ms). Tests that
 * assert post-reveal banners run with fake timers and advance past
 * the reveal window before asserting.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, render, renderHook } from "@testing-library/react";
import { Stage } from "../Stage";
import { useMomentumMock } from "../useMomentumMock";
import type { MomentumSurfaceProps } from "../types";

function stageProps(p: MomentumSurfaceProps) {
  return {
    gameCode: p.gameCode,
    selection: p.selection,
    bet: p.bet,
    clientSeed: p.clientSeed,
    commitment: p.commitment,
    verification: p.verification,
    busy: p.busy,
    onClientSeedChange: p.onClientSeedChange,
  };
}

describe("Momentum · combo orchestration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("play-win-from-0 → next selection.comboBefore === 1", async () => {
    const { result } = renderHook(() =>
      useMomentumMock({ scenarioQueue: ["play-win-from-0"] }),
    );
    await act(async () => {
      result.current.onSubmitBet({ cashOut: false });
    });
    expect(result.current.selection.comboBefore).toBe(1);
    expect(result.current.bet?.result).toMatchObject({
      comboAfter: 1,
      won: true,
      cashedOut: false,
    });
  });

  it("play-loss → next selection.comboBefore === 0", async () => {
    const { result } = renderHook(() =>
      useMomentumMock({ scenarioQueue: ["play-loss"] }),
    );
    await act(async () => {
      result.current.onSubmitBet({ cashOut: false });
    });
    expect(result.current.selection.comboBefore).toBe(0);
    expect(result.current.bet?.result).toMatchObject({
      comboAfter: 0,
      won: false,
    });
  });

  it("during play-win, after roll-reveal Stage renders comboMultiplier and NO cashout banner (totalMultiplier absent)", async () => {
    const { result } = renderHook(() =>
      useMomentumMock({ scenarioQueue: ["play-win-from-4"] }),
    );
    await act(async () => {
      result.current.onSubmitBet({ cashOut: false });
    });
    const props = result.current;
    const { container } = render(<Stage {...stageProps(props)} />);
    // Advance past the roll-reveal window so banners flip from
    // quarantined → revealed. CashOut path has no roll anim, but play
    // path must wait ≤900ms.
    await act(async () => {
      vi.advanceTimersByTime(950);
    });
    expect(container.querySelector('[data-testid="momentum-step-mult"]')?.textContent).toContain("7.59");
    expect(container.querySelector('[data-testid="momentum-banner-cashout"]')).toBeNull();
    expect(container.querySelector('[data-testid="momentum-banner-cashout-total"]')).toBeNull();
    expect(container.querySelector('[data-testid="momentum-banner-win"]')).not.toBeNull();
  });

  it("cashout-at-5 → Stage renders totalMultiplier in bank-pop banner", async () => {
    const { result } = renderHook(() =>
      useMomentumMock({ scenarioQueue: ["cashout-at-5"] }),
    );
    // Seed selection.comboBefore = 5 first by jumping straight to cashout.
    await act(async () => {
      result.current.onSubmitBet({ cashOut: true });
    });
    const props = result.current;
    const { container } = render(<Stage {...stageProps(props)} />);
    // CashOut path reveals immediately (no roll anim).
    const banner = container.querySelector(
      '[data-testid="momentum-banner-cashout-total"]',
    );
    expect(banner).not.toBeNull();
    expect(banner?.textContent).toContain("7.59");
  });
});
