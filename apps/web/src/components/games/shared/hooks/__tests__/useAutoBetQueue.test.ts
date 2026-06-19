/**
 * useAutoBetQueue — P1.5-A LOCK tests.
 *
 * Settle is keyed on `bet` reference inequality (handles WIN→WIN repeats).
 * Tests cover: martingale, paroli reset, stop on profit/loss, infinite,
 * onFire throw → error stop, busy gate, active=false stop, balance guard,
 * scale-overflow stop, WIN→WIN consecutive advance.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  type AutoBetConfig,
  DEFAULT_AUTOBET,
  INFINITE_REMAINING,
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
const lossBet = (): BetResult => ({
  status: "lost",
  payout: "0",
  result: {},
  multiplier: "0",
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

describe("useAutoBetQueue · P1.5-A LOCK", () => {
  it("fires once when ready and decrements remaining on settle", async () => {
    const onFire = vi.fn(async () => {});
    const cfg: AutoBetConfig = { ...DEFAULT_AUTOBET, count: 3 };
    const hook = renderHook((p: UseAutoBetQueueOptions) => useAutoBetQueue(p), {
      initialProps: makeProps(cfg, { onFire }),
    });
    await advance();
    expect(onFire).toHaveBeenCalledTimes(1);
    expect(onFire).toHaveBeenLastCalledWith("1");

    hook.rerender(makeProps(cfg, { onFire, bet: winBet() }));
    await advance();
    expect(hook.result.current.remaining).toBe(2);
    expect(onFire).toHaveBeenCalledTimes(2);
  });

  it("martingale: doubles stake on loss", async () => {
    const onFire = vi.fn(async () => {});
    const cfg: AutoBetConfig = { ...DEFAULT_AUTOBET, count: 5, onLossMultiplier: 2, onLossReset: false };
    const hook = renderHook((p: UseAutoBetQueueOptions) => useAutoBetQueue(p), {
      initialProps: makeProps(cfg, { onFire }),
    });
    await advance();
    expect(onFire).toHaveBeenLastCalledWith("1");

    hook.rerender(makeProps(cfg, { onFire, bet: lossBet() }));
    await advance();
    expect(hook.result.current.runningStake).toBe("2");
    expect(onFire).toHaveBeenLastCalledWith("2");

    // New loss bet (different object reference) → settle again
    hook.rerender(makeProps(cfg, { onFire, bet: lossBet() }));
    await advance();
    expect(hook.result.current.runningStake).toBe("4");
  });

  it("WIN→WIN consecutive: advances on each new bet object", async () => {
    const onFire = vi.fn(async () => {});
    const cfg: AutoBetConfig = { ...DEFAULT_AUTOBET, count: 4 };
    const hook = renderHook((p: UseAutoBetQueueOptions) => useAutoBetQueue(p), {
      initialProps: makeProps(cfg, { onFire }),
    });
    await advance();
    expect(onFire).toHaveBeenCalledTimes(1);

    hook.rerender(makeProps(cfg, { onFire, bet: winBet("1.5") }));
    await advance();
    expect(onFire).toHaveBeenCalledTimes(2);

    hook.rerender(makeProps(cfg, { onFire, bet: winBet("2.0") }));
    await advance();
    expect(onFire).toHaveBeenCalledTimes(3);
    expect(hook.result.current.remaining).toBe(2);
  });

  it("stops on profit limit", async () => {
    const onStop = vi.fn();
    const cfg: AutoBetConfig = { ...DEFAULT_AUTOBET, count: 10, stopOnProfit: "1" };
    const hook = renderHook((p: UseAutoBetQueueOptions) => useAutoBetQueue(p), {
      initialProps: makeProps(cfg, { onStop }),
    });
    await advance();
    hook.rerender(makeProps(cfg, { onStop, bet: winBet("2") }));
    await advance();
    expect(onStop).toHaveBeenCalledWith("profit");
  });

  it("stops on loss limit", async () => {
    const onStop = vi.fn();
    const cfg: AutoBetConfig = { ...DEFAULT_AUTOBET, count: 10, stopOnLoss: "1" };
    const hook = renderHook((p: UseAutoBetQueueOptions) => useAutoBetQueue(p), {
      initialProps: makeProps(cfg, { onStop }),
    });
    await advance();
    hook.rerender(makeProps(cfg, { onStop, bet: lossBet() }));
    await advance();
    expect(onStop).toHaveBeenCalledWith("loss");
  });

  it("count=0 → infinite (INFINITE_REMAINING) and does not decrement", async () => {
    const onFire = vi.fn(async () => {});
    const cfg: AutoBetConfig = { ...DEFAULT_AUTOBET, count: 0 };
    const hook = renderHook((p: UseAutoBetQueueOptions) => useAutoBetQueue(p), {
      initialProps: makeProps(cfg, { onFire }),
    });
    expect(hook.result.current.remaining).toBe(INFINITE_REMAINING);
    await advance();
    hook.rerender(makeProps(cfg, { onFire, bet: winBet() }));
    await advance();
    expect(hook.result.current.remaining).toBe(INFINITE_REMAINING);
  });

  it("onFire throws → stop with reason=error", async () => {
    const onStop = vi.fn();
    const boom = vi.fn(async () => {
      throw new Error("rpc fail");
    });
    const cfg: AutoBetConfig = { ...DEFAULT_AUTOBET, count: 3 };
    renderHook(() => useAutoBetQueue(makeProps(cfg, { onFire: boom, onStop })));
    await advance();
    expect(boom).toHaveBeenCalled();
    expect(onStop).toHaveBeenCalledWith("error");
  });

  it("does not fire while busy=true", async () => {
    const onFire = vi.fn(async () => {});
    const cfg: AutoBetConfig = { ...DEFAULT_AUTOBET, count: 3 };
    renderHook(() => useAutoBetQueue(makeProps(cfg, { onFire, busy: true })));
    await advance(1000);
    expect(onFire).not.toHaveBeenCalled();
  });

  it("active=false → remaining=0", async () => {
    const cfg: AutoBetConfig = { ...DEFAULT_AUTOBET, count: 3 };
    const hook = renderHook((p: UseAutoBetQueueOptions) => useAutoBetQueue(p), {
      initialProps: makeProps(cfg),
    });
    await advance();
    hook.rerender(makeProps(cfg, { active: false }));
    expect(hook.result.current.remaining).toBe(0);
    act(() => hook.result.current.stop());
  });

  it("balance guard: stake > availableBalance → stop=balance", async () => {
    const onStop = vi.fn();
    const onFire = vi.fn(async () => {});
    const cfg: AutoBetConfig = { ...DEFAULT_AUTOBET, count: 5 };
    renderHook(() =>
      useAutoBetQueue(
        makeProps(cfg, {
          onFire,
          onStop,
          baseStake: "10",
          availableBalance: "1",
        }),
      ),
    );
    await advance();
    expect(onFire).not.toHaveBeenCalled();
    expect(onStop).toHaveBeenCalledWith("balance");
  });

  it("scale overflow: martingale beyond MAX_STAKE → stop=error", async () => {
    const onStop = vi.fn();
    const cfg: AutoBetConfig = {
      ...DEFAULT_AUTOBET,
      count: 50,
      onLossMultiplier: 1e10,
      onLossReset: false,
    };
    const hook = renderHook((p: UseAutoBetQueueOptions) => useAutoBetQueue(p), {
      initialProps: makeProps(cfg, { onStop, baseStake: "1000" }),
    });
    await advance();
    hook.rerender(
      makeProps(cfg, { onStop, baseStake: "1000", bet: lossBet() }),
    );
    await advance();
    expect(onStop).toHaveBeenCalledWith("error");
  });

  // ───────────────────────── P2.0b · Reset vs Increase toggles ─────────────────────────

  it("P2.0b · win/reset (default): stake returns to baseStake after a win", async () => {
    const onFire = vi.fn(async () => {});
    const cfg: AutoBetConfig = {
      ...DEFAULT_AUTOBET,
      count: 4,
      onWinMultiplier: 1.5, // ignored because onWinReset defaults to true
    };
    const hook = renderHook((p: UseAutoBetQueueOptions) => useAutoBetQueue(p), {
      initialProps: makeProps(cfg, { onFire, baseStake: "100" }),
    });
    await advance();
    expect(onFire).toHaveBeenLastCalledWith("100");
    hook.rerender(makeProps(cfg, { onFire, baseStake: "100", bet: winBet("2") }));
    await advance();
    expect(hook.result.current.runningStake).toBe("100");
    expect(onFire).toHaveBeenLastCalledWith("100");
  });

  it("P2.0b · win/×1.5 (opt-in): stake scales by 1.5 when onWinReset=false", async () => {
    const onFire = vi.fn(async () => {});
    const cfg: AutoBetConfig = {
      ...DEFAULT_AUTOBET,
      count: 4,
      onWinReset: false,
      onWinMultiplier: 1.5,
    };
    const hook = renderHook((p: UseAutoBetQueueOptions) => useAutoBetQueue(p), {
      initialProps: makeProps(cfg, { onFire, baseStake: "100" }),
    });
    await advance();
    expect(onFire).toHaveBeenLastCalledWith("100");
    hook.rerender(makeProps(cfg, { onFire, baseStake: "100", bet: winBet("2") }));
    await advance();
    expect(hook.result.current.runningStake).toBe("150");
    expect(onFire).toHaveBeenLastCalledWith("150");
  });

  it("P2.0b · loss/reset (default): stake returns to baseStake after a loss", async () => {
    const onFire = vi.fn(async () => {});
    const cfg: AutoBetConfig = {
      ...DEFAULT_AUTOBET,
      count: 4,
      onLossMultiplier: 2, // ignored because onLossReset defaults to true
    };
    const hook = renderHook((p: UseAutoBetQueueOptions) => useAutoBetQueue(p), {
      initialProps: makeProps(cfg, { onFire, baseStake: "100" }),
    });
    await advance();
    expect(onFire).toHaveBeenLastCalledWith("100");
    hook.rerender(makeProps(cfg, { onFire, baseStake: "100", bet: lossBet() }));
    await advance();
    expect(hook.result.current.runningStake).toBe("100");
    expect(onFire).toHaveBeenLastCalledWith("100");
  });

  it("P2.0b · loss/×2 (opt-in): stake doubles when onLossReset=false", async () => {
    const onFire = vi.fn(async () => {});
    const cfg: AutoBetConfig = {
      ...DEFAULT_AUTOBET,
      count: 4,
      onLossReset: false,
      onLossMultiplier: 2,
    };
    const hook = renderHook((p: UseAutoBetQueueOptions) => useAutoBetQueue(p), {
      initialProps: makeProps(cfg, { onFire, baseStake: "100" }),
    });
    await advance();
    expect(onFire).toHaveBeenLastCalledWith("100");
    hook.rerender(makeProps(cfg, { onFire, baseStake: "100", bet: lossBet() }));
    await advance();
    expect(hook.result.current.runningStake).toBe("200");
    expect(onFire).toHaveBeenLastCalledWith("200");
  });
});
