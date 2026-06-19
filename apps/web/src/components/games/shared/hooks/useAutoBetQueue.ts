/**
 * Auto-Bet queue (UI-only) — P1.5-A LOCK + §0a hardening (autobet-layer v2).
 *
 * Settle truth = `bet` reference change.
 *  - When `bet` transitions to a NEW non-null reference (object identity), the
 *    outstanding fire is considered settled and the queue advances. This is
 *    robust against same-result repeats (WIN→WIN, LOSS→LOSS) which the prior
 *    `lastWasWin` boolean comparison missed.
 *  - When `bet` returns to null (caller's `onPrepareRound` clears it), the
 *    hook treats it as round reset — no settle event.
 *
 * Invariants:
 *  - A1: 1 fire = 1 round. Hook only invokes `onFire(stake)`.
 *  - A2: Caller `onFire` is the A6 wrapper (prepare-if-needed → submit).
 *  - A3: Fire gated on `busy === false` && no outstanding fire.
 *  - A4: win = `Number(bet.multiplier ?? 0) >= 1.01`.
 *  - A5: stake = decimal string. Number() only for arithmetic snapshots.
 *  - A7: `onFire` throw → immediate stop("error"), no retry.
 *  - A8: `active === false` → immediate stop.
 *  - count===0 → infinite (sentinel -1).
 *  - 10min idle ceiling → stop("idle").
 *  - balance guard: `runningStake > availableBalance` → stop("loss").
 *  - scale guard: stake ≥ 1e12 or non-finite → stop("error").
 *
 * §0a hardening:
 *  - MAX_SESSION_BETS hard ceiling (default 10_000). Override via
 *    `maxSessionBets` for tests. Triggers `"session_cap"` reason.
 *  - `document.hidden` pauses the fire scheduler (in-flight fire still
 *    awaited). Resumes on visibilitychange → visible.
 *  - `stop()` now waits for any in-flight fire to settle before calling
 *    `finish("manual")`. If nothing is in flight, finishes immediately
 *    (preserves existing test expectation).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { BetResult } from "../types";
import { deriveUiWin } from "../derive-ui-bet";

export interface AutoBetConfig {
  count: number;
  stopOnProfit: string;
  stopOnLoss: string;
  onLossMultiplier: number;
  onWinMultiplier: number;
  /** P2.0b — when true (default), stake resets to baseStake on win. */
  onWinReset?: boolean;
  /** P2.0b — when true (default), stake resets to baseStake on loss. */
  onLossReset?: boolean;
}

export const DEFAULT_AUTOBET: AutoBetConfig = {
  count: 10,
  stopOnProfit: "",
  stopOnLoss: "",
  onLossMultiplier: 1,
  onWinMultiplier: 1,
  onWinReset: true,
  onLossReset: true,
};

export const INFINITE_REMAINING = -1;
const IDLE_CEILING_MS = 10 * 60 * 1000;
// Default inter-fire delay for instant-settle games (Dice/Limbo/etc.).
// Stake-class round games (Crash) pass `fireDelayMs: 5000` via caller to
// align with the inter-round betting window.
const FIRE_DELAY_MS = 320;
const COUNTDOWN_TICK_MS = 100;
const MAX_STAKE_HARD = 1e12;
/** §0a hard session-bets ceiling. Cannot be exceeded even when count=0 (infinite). */
export const MAX_SESSION_BETS = 10_000;

export type AutoStopReason =
  | "complete"
  | "profit"
  | "loss"
  | "error"
  | "idle"
  | "manual"
  | "balance"
  | "session_cap";

function scaleStake(
  decimal: string,
  mult: number,
): { next: string; ok: boolean } {
  const n = Number(decimal) || 0;
  const out = n * mult;
  if (!Number.isFinite(out) || out <= 0 || out >= MAX_STAKE_HARD) {
    return { next: decimal, ok: false };
  }
  return { next: out.toFixed(6).replace(/\.?0+$/, "") || "0", ok: true };
}

function fmtDecimal(n: number): string {
  return n.toFixed(6).replace(/\.?0+$/, "") || "0";
}

function deriveWin(bet: BetResult | null): boolean | null {
  // #P2.0c-T2 — single derivation site; no inline cashedOut/cashoutMultiplier.
  return deriveUiWin(bet);
}

export interface UseAutoBetQueueOptions {
  active: boolean;
  config: AutoBetConfig;
  baseStake: string;
  onFire: (stake: string) => void | Promise<void>;
  /**
   * Latest settled bet (or null after prepare). Reference inequality between
   * renders signals a new settle event — same WIN→WIN sequences are handled
   * correctly because each settle yields a new BetResult object.
   *
   * Back-compat: if caller still passes `lastWasWin`, it's ignored.
   */
  bet: BetResult | null;
  busy: boolean;
  /** Optional balance guard. When set, fires that would exceed it stop the queue. */
  availableBalance?: string | null;
  onStop?: (reason: AutoStopReason) => void;
  /**
   * Optional per-caller inter-fire delay (ms). Defaults to FIRE_DELAY_MS (320).
   * Crash passes 5000 to mirror Stake's inter-round betting window.
   */
  fireDelayMs?: number;
  /** Test-only override of the §0a session ceiling. Production callers omit. */
  maxSessionBets?: number;
}

export interface UseAutoBetQueueReturn {
  remaining: number;
  runningStake: string;
  cumulativeProfit: string;
  stop: () => void;
  /** ms remaining until next auto-fire (0 when not pending). */
  pendingMs: number;
  /** Seconds remaining (= pendingMs / 1000). */
  secondsRemaining: number;
  /** §0a — true after Stop pressed but before the in-flight settle completes. */
  stopping: boolean;
  /** §0a — true when fire scheduler is paused by `document.hidden`. */
  pausedByHidden: boolean;
  /** §0a — fires placed in the current session (for diagnostics + cap). */
  firesPlaced: number;
}

export function useAutoBetQueue(
  opts: UseAutoBetQueueOptions,
): UseAutoBetQueueReturn {
  const {
    active,
    config,
    baseStake,
    onFire,
    bet,
    busy,
    availableBalance,
    onStop,
    fireDelayMs,
    maxSessionBets,
  } = opts;
  const effectiveDelay = fireDelayMs ?? FIRE_DELAY_MS;
  const sessionCap = maxSessionBets ?? MAX_SESSION_BETS;

  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(baseStake);
  const [cum, setCum] = useState("0");
  const [pendingMs, setPendingMs] = useState(0);
  const [stopping, setStopping] = useState(false);
  const [pausedByHidden, setPausedByHidden] = useState(false);
  const [firesPlaced, setFiresPlaced] = useState(0);
  const pendingStartRef = useRef<number | null>(null);

  const stakeRef = useRef(baseStake);
  const profitRef = useRef(0);
  const lastFireStakeRef = useRef<string | null>(null);
  const lastBetRef = useRef<BetResult | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const firingRef = useRef(false);
  const stoppedRef = useRef(false);
  const stoppingRef = useRef(false);
  const pausedRef = useRef(false);
  const firesRef = useRef(0);

  const finish = useCallback(
    (reason: AutoStopReason) => {
      if (stoppedRef.current) return;
      stoppedRef.current = true;
      setRemaining(0);
      setStopping(false);
      stoppingRef.current = false;
      lastFireStakeRef.current = null;
      firingRef.current = false;
      onStop?.(reason);
    },
    [onStop],
  );

  // Reset on Start / Stop transitions.
  useEffect(() => {
    if (active) {
      stoppedRef.current = false;
      stoppingRef.current = false;
      setStopping(false);
      setRemaining(config.count === 0 ? INFINITE_REMAINING : config.count);
      stakeRef.current = baseStake;
      setRunning(baseStake);
      profitRef.current = 0;
      setCum("0");
      lastFireStakeRef.current = null;
      lastBetRef.current = bet; // snapshot — only future bet changes count.
      lastActivityRef.current = Date.now();
      firingRef.current = false;
      firesRef.current = 0;
      setFiresPlaced(0);
    } else {
      setRemaining(0);
      firingRef.current = false;
      setStopping(false);
      stoppingRef.current = false;
    }
     
  }, [active]);

  // §0a — visibility pause. Register only while active.
  useEffect(() => {
    if (!active) {
      pausedRef.current = false;
      setPausedByHidden(false);
      return;
    }
    if (typeof document === "undefined") return;
    const update = () => {
      const hidden = document.hidden;
      pausedRef.current = hidden;
      setPausedByHidden(hidden);
    };
    update();
    document.addEventListener("visibilitychange", update);
    return () => {
      document.removeEventListener("visibilitychange", update);
      pausedRef.current = false;
      setPausedByHidden(false);
    };
  }, [active]);

  // Settle: react to bet reference change while a fire is outstanding.
  useEffect(() => {
    if (!active) return;
    if (bet === lastBetRef.current) return;
    lastBetRef.current = bet;
    // bet === null → caller cleared (prepare); not a settle event.
    if (bet === null) return;
    // No outstanding fire (e.g. settle of a manual bet placed before Start) → ignore.
    if (lastFireStakeRef.current === null) return;

    const win = deriveWin(bet);
    if (win === null) return;

    const stakeNum = Number(lastFireStakeRef.current) || 0;
    if (win) {
      const payoutNum = Number(bet.payout ?? "0") || 0;
      // profit on win = payout - stake (if payout missing, fall back to stake*mult-stake)
      const mult = Number(bet.multiplier ?? "0") || 0;
      const gain = payoutNum > 0 ? payoutNum - stakeNum : stakeNum * Math.max(0, mult - 1);
      profitRef.current += gain;
      if (config.onWinReset !== false) {
        stakeRef.current = baseStake;
      } else if (config.onWinMultiplier !== 1) {
        const r = scaleStake(stakeRef.current, config.onWinMultiplier);
        if (!r.ok) return finish("error");
        stakeRef.current = r.next;
      }
    } else {
      profitRef.current -= stakeNum;
      if (config.onLossReset !== false) {
        stakeRef.current = baseStake;
      } else if (config.onLossMultiplier !== 1) {
        const r = scaleStake(stakeRef.current, config.onLossMultiplier);
        if (!r.ok) return finish("error");
        stakeRef.current = r.next;
      }
    }
    setRunning(stakeRef.current);
    setCum(fmtDecimal(profitRef.current));
    lastFireStakeRef.current = null;
    lastActivityRef.current = Date.now();

    // §0a — Stop pressed during in-flight: finish AFTER this settle is observed.
    if (stoppingRef.current) {
      return finish("manual");
    }

    const sop = Number(config.stopOnProfit);
    if (config.stopOnProfit && Number.isFinite(sop) && profitRef.current >= sop) {
      return finish("profit");
    }
    const sol = Number(config.stopOnLoss);
    if (config.stopOnLoss && Number.isFinite(sol) && -profitRef.current >= sol) {
      return finish("loss");
    }

    // §0a — session cap (applies even in infinite mode).
    if (firesRef.current >= sessionCap) {
      return finish("session_cap");
    }

    setRemaining((r) => {
      if (r === INFINITE_REMAINING) return r;
      const next = Math.max(0, r - 1);
      if (next === 0) queueMicrotask(() => finish("complete"));
      return next;
    });
  }, [bet, active, config, baseStake, finish, sessionCap]);

  // Fire when ready.
  useEffect(() => {
    if (!active || busy) return;
    if (stoppingRef.current) return; // §0a — no new fires once Stop pressed.
    if (pausedRef.current) return; // §0a — visibility pause.
    if (lastFireStakeRef.current !== null) return;
    if (firingRef.current) return;
    if (remaining === 0) return;
    // §0a — session cap pre-check (guards infinite mode).
    if (firesRef.current >= sessionCap) {
      finish("session_cap");
      return;
    }

    // Balance guard — pre-fire.
    if (availableBalance != null && availableBalance !== "") {
      const bal = Number(availableBalance);
      const next = Number(stakeRef.current);
      if (Number.isFinite(bal) && Number.isFinite(next) && next > bal) {
        finish("balance");
        return;
      }
    }

    pendingStartRef.current = Date.now();
    setPendingMs(effectiveDelay);

    const id = window.setTimeout(async () => {
      pendingStartRef.current = null;
      setPendingMs(0);
      if (firingRef.current || stoppedRef.current || stoppingRef.current) return;
      if (pausedRef.current) return;
      firingRef.current = true;
      const stake = stakeRef.current;
      lastFireStakeRef.current = stake;
      firesRef.current += 1;
      setFiresPlaced(firesRef.current);
      lastActivityRef.current = Date.now();
      try {
        await onFire(stake);
      } catch {
        finish("error");
        return;
      } finally {
        firingRef.current = false;
      }
    }, effectiveDelay);
    return () => {
      window.clearTimeout(id);
      pendingStartRef.current = null;
      setPendingMs(0);
    };
  }, [active, busy, remaining, onFire, availableBalance, finish, effectiveDelay, sessionCap, pausedByHidden, bet]);

  // Countdown tick — updates pendingMs while a fire is scheduled.
  useEffect(() => {
    if (!active) {
      setPendingMs(0);
      pendingStartRef.current = null;
      return;
    }
    const id = window.setInterval(() => {
      const start = pendingStartRef.current;
      if (start == null) return;
      const remainingMs = Math.max(0, effectiveDelay - (Date.now() - start));
      setPendingMs(remainingMs);
    }, COUNTDOWN_TICK_MS);
    return () => window.clearInterval(id);
  }, [active, effectiveDelay]);

  // Idle ceiling.
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      if (Date.now() - lastActivityRef.current >= IDLE_CEILING_MS) {
        finish("idle");
      }
    }, 30_000);
    return () => window.clearInterval(id);
  }, [active, finish]);

  const stop = useCallback(() => {
    // §0a — if a fire is in flight or scheduled, wait for its settle before
    // finishing. Otherwise finish immediately (preserves prior semantics for
    // idle-state Stop, which existing tests rely on).
    if (firingRef.current || lastFireStakeRef.current !== null) {
      stoppingRef.current = true;
      setStopping(true);
      return;
    }
    finish("manual");
  }, [finish]);

  return {
    remaining,
    runningStake: running,
    cumulativeProfit: cum,
    stop,
    pendingMs,
    secondsRemaining: pendingMs / 1000,
    stopping,
    pausedByHidden,
    firesPlaced,
  };
}
