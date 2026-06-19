/**
 * useAutoBetQueue · §0a safety gate unit tests (autobet-layer v2).
 *
 * Deterministic coverage of the four blocking-grade gates:
 *  1. Refuse unbounded start  → covered at the panel level (gate is in the
 *     panel; the hook respects whatever `active` value the panel sets, so
 *     hook-level test verifies `count=0 + no stops` does NOT auto-cap below
 *     MAX_SESSION_BETS by accident).
 *  2. Stop mid-settle         → stop() while in-flight defers finish until
 *                                the next bet reference change is observed.
 *  3. Insufficient balance    → existing test in useAutoBetQueue.test.ts.
 *                                Re-asserted here with explicit reason.
 *  4. Session cap             → MAX_SESSION_BETS ceiling halts infinite mode.
 *
 * Existing tests in useAutoBetQueue.test.ts are not modified.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  type AutoBetConfig,
  DEFAULT_AUTOBET,
  type UseAutoBetQueueOptions,
  useAutoBetQueue,
} from "../useAutoBetQueue";
import type { BetResult } from "../../types";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

const winBet = (mult = "2"): BetResult => ({
  status: "won",
  payout: String(Number(mult) * 1),
  result: {},
  multiplier: mult,
});

function makeProps(
  cfg: AutoBetConfig,
  overrides: Partial<UseAutoBetQueueOptions> = {},
): UseAutoBetQueueOptions {
  return {
    active: true,
    config: cfg,
    baseStake: "1",
    onFire: vi.fn(async () => {}),
    bet: null,
    busy: false,
    onStop: vi.fn(),
    ...overrides,
  };
}

async function advance(ms = 400) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe("useAutoBetQueue · §0a safety gates", () => {
  it("Gate 2: stop() during in-flight defers finish until next settle", async () => {
    const onStop = vi.fn();
    let resolveFire: (() => void) | null = null;
    const onFire = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveFire = resolve;
        }),
    );
    const cfg: AutoBetConfig = { ...DEFAULT_AUTOBET, count: 5 };
    const hook = renderHook((p: UseAutoBetQueueOptions) => useAutoBetQueue(p), {
      initialProps: makeProps(cfg, { onFire, onStop }),
    });
    await advance();
    expect(onFire).toHaveBeenCalledTimes(1);

    // Stop pressed while fire is in flight — must NOT call onStop yet.
    act(() => hook.result.current.stop());
    expect(hook.result.current.stopping).toBe(true);
    expect(onStop).not.toHaveBeenCalled();

    // Resolve the in-flight onFire promise.
    await act(async () => {
      resolveFire?.();
      await Promise.resolve();
    });
    // Still no stop until the settle is observed.
    expect(onStop).not.toHaveBeenCalled();

    // Deliver the settle event — now stop completes with reason=manual.
    hook.rerender(makeProps(cfg, { onFire, onStop, bet: winBet() }));
    await advance();
    expect(onStop).toHaveBeenCalledWith("manual");
    // No further fires queued.
    expect(onFire).toHaveBeenCalledTimes(1);
  });

  it("Gate 3: insufficient balance pre-fire → stop=balance, zero fires", async () => {
    const onStop = vi.fn();
    const onFire = vi.fn(async () => {});
    const cfg: AutoBetConfig = { ...DEFAULT_AUTOBET, count: 5 };
    renderHook(() =>
      useAutoBetQueue(
        makeProps(cfg, {
          onFire,
          onStop,
          baseStake: "10",
          availableBalance: "5",
        }),
      ),
    );
    await advance();
    expect(onFire).not.toHaveBeenCalled();
    expect(onStop).toHaveBeenCalledWith("balance");
  });

  it("Gate 4: session cap halts the loop at the ceiling", async () => {
    const onStop = vi.fn();
    const onFire = vi.fn(async () => {});
    // count > cap so the session cap (not remaining) is what triggers stop.
    const cfg: AutoBetConfig = { ...DEFAULT_AUTOBET, count: 10 };
    const hook = renderHook((p: UseAutoBetQueueOptions) => useAutoBetQueue(p), {
      initialProps: makeProps(cfg, { onFire, onStop, maxSessionBets: 3 }),
    });
    await advance();
    expect(onFire).toHaveBeenCalledTimes(1);

    hook.rerender(
      makeProps(cfg, { onFire, onStop, maxSessionBets: 3, bet: winBet() }),
    );
    await advance();
    expect(onFire).toHaveBeenCalledTimes(2);

    hook.rerender(
      makeProps(cfg, { onFire, onStop, maxSessionBets: 3, bet: winBet() }),
    );
    await advance();
    expect(onFire).toHaveBeenCalledTimes(3);

    // 4th settle must trip the cap, not schedule fire #4.
    hook.rerender(
      makeProps(cfg, { onFire, onStop, maxSessionBets: 3, bet: winBet() }),
    );
    await advance();
    expect(onFire).toHaveBeenCalledTimes(3);
    expect(onStop).toHaveBeenCalledWith("session_cap");
  });


  it("Gate 1 (hook-level): count=0 alone reports INFINITE_REMAINING without auto-capping", async () => {
    // The Start refusal is enforced at the panel level. At the hook level,
    // when the panel does grant `active=true` (e.g. because the user added
    // a stopOnLoss), infinite mode must remain infinite until cap/stop.
    const cfg: AutoBetConfig = { ...DEFAULT_AUTOBET, count: 0 };
    const hook = renderHook(() => useAutoBetQueue(makeProps(cfg)));
    await advance();
    expect(hook.result.current.remaining).toBeLessThan(0); // INFINITE_REMAINING sentinel
  });
});
