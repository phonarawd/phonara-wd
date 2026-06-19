/**
 * Crash · Round context (P2.0 LOCK v1.1).
 *
 * Replay model — owns the per-round display state for the live
 * multiplier. The number is held in a ref (no per-frame setState)
 * and exposed via `readDisplayM()`. Consumers that need to paint
 * the number subscribe a writer (e.g. the rAF loop) and a reader
 * (the DOM node textContent updater).
 *
 * INVARIANTS (FAIL gates):
 *  - No client-known revealed crash mult based cashout decision (engine wave only).
 *  - No invented round clock — start time is derived from the bet
 *    payload's reveal moment; if absent, phase stays "idle".
 *  - `m(t)` curve here is replay-only (not authoritative payout).
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

export type CrashPhase = "idle" | "running" | "crashed";

interface CrashRoundState {
  phase: CrashPhase;
  /** Server-revealed crash multiplier for the resolved bet, if any. */
  revealedCrashMult: number;
  /** User-selected auto-cashout target. Replay only — engine decides payout. */
  auto: number;
  /** Local replay start timestamp (performance.now). */
  startedAt: number;
}

interface CrashRoundCtx {
  /** Mutable round state (ref). */
  state: { current: CrashRoundState };
  /** Read current display multiplier (e.g. "1.23"). Ref-based, no re-render. */
  readDisplayM(): string;
  /** Writer set by the rAF loop — pushes a numeric value. */
  writeDisplayM(value: number): void;
  /** Subscribe a DOM mutator; returns unsubscribe. */
  subscribe(fn: (v: string) => void): () => void;
  /** Reset round (called when a new bet result lands). */
  resetRound(input: { revealedCrashMult: number; auto: number }): void;
}

const Ctx = createContext<CrashRoundCtx | null>(null);

export function CrashRoundProvider({ children }: { children: ReactNode }) {
  const state = useRef<CrashRoundState>({
    phase: "idle",
    revealedCrashMult: 1,
    auto: 2,
    startedAt: 0,
  });
  const displayRef = useRef<string>("1.00");
  const subs = useRef<Set<(v: string) => void>>(new Set());

  const readDisplayM = useCallback(() => displayRef.current, []);
  const writeDisplayM = useCallback((value: number) => {
    const next = value.toFixed(2);
    if (next === displayRef.current) return;
    displayRef.current = next;
    subs.current.forEach((fn) => fn(next));
  }, []);
  const subscribe = useCallback((fn: (v: string) => void) => {
    subs.current.add(fn);
    fn(displayRef.current);
    return () => {
      subs.current.delete(fn);
    };
  }, []);
  const resetRound = useCallback(
    ({ revealedCrashMult, auto }: { revealedCrashMult: number; auto: number }) => {
      state.current.phase = "running";
      state.current.revealedCrashMult = revealedCrashMult;
      state.current.auto = auto;
      state.current.startedAt = performance.now();
      displayRef.current = "1.00";
      subs.current.forEach((fn) => fn("1.00"));
    },
    [],
  );

  const value = useMemo<CrashRoundCtx>(
    () => ({ state, readDisplayM, writeDisplayM, subscribe, resetRound }),
    [readDisplayM, writeDisplayM, subscribe, resetRound],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCrashRound(): CrashRoundCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCrashRound must be used inside CrashRoundProvider");
  return v;
}

/** Safe variant for components that may render outside the provider. */
export function useCrashRoundOptional(): CrashRoundCtx | null {
  return useContext(Ctx);
}
