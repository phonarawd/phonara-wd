/**
 * Auto-bet session — pure reducer + UI mirror (CASINO_UX_CANON · ENGINE_BOUNDARY).
 * Loop truth = local `AutoBetSessionState` via `stepAutoBetSession`; React state is display-only.
 * Does not drive ledger; each fire calls the round pipeline RPC with stakeOverride.
 */
import { useCallback, useRef, useState } from 'react';
import { toDecimal } from '@phonara/money';

export type AutoBetAdjustMode = 'reset' | 'increase';

export type AutoBetConfig = {
  /** 0 = infinite (requires stopOnLoss > 0). */
  count: number;
  stopOnProfit: string;
  stopOnLoss: string;
  onWinMode: AutoBetAdjustMode;
  onLossMode: AutoBetAdjustMode;
  onWinIncreasePercent: string;
  onLossIncreasePercent: string;
  baseStake: string;
};

export type AutoBetQueueStatus = 'idle' | 'running' | 'stopping' | 'paused';

export type AutoBetFireOutcome = {
  /** Display-only PnL delta from RPC (payout − stake). */
  profitDelta: string;
  won: boolean;
};

export type AutoBetQueueState = {
  status: AutoBetQueueStatus;
  remaining: number | null;
  cumulativeProfit: string;
  firesPlaced: number;
  nextStake: string;
};

/** Pure session — loop source of truth (not React state). */
export type AutoBetSessionState = {
  status: AutoBetQueueStatus;
  remaining: number | null;
  cumulativeProfit: string;
  firesPlaced: number;
  nextStake: string;
  config: AutoBetConfig;
  stopRequested: boolean;
};

export type AutoBetStepResult = {
  state: AutoBetSessionState;
  decision: 'continue' | 'stop';
};

function isPositiveDecimal(value: string): boolean {
  try {
    return toDecimal(value, 'auto-limit').gt(0);
  } catch {
    return false;
  }
}

function adjustStake(
  baseStake: string,
  currentStake: string,
  mode: AutoBetAdjustMode,
  increasePercent: string,
): string {
  if (mode === 'reset') return baseStake;
  try {
    const pct = toDecimal(increasePercent || '0', 'increasePercent');
    const factor = toDecimal('1', 'one').add(pct.div(100));
    return toDecimal(currentStake, 'stake').mul(factor).toFixed();
  } catch {
    return baseStake;
  }
}

export function canStartAutoBet(config: AutoBetConfig): boolean {
  return config.count > 0 || isPositiveDecimal(config.stopOnLoss);
}

/** Create a running session from config, or null if start is invalid. */
export function createAutoBetSession(config: AutoBetConfig): AutoBetSessionState | null {
  if (!canStartAutoBet(config)) return null;
  return {
    status: 'running',
    remaining: config.count > 0 ? config.count : null,
    cumulativeProfit: '0',
    firesPlaced: 0,
    nextStake: config.baseStake,
    config,
    stopRequested: false,
  };
}

/** Mark stop requested (user Stop) — next step after fire will idle. */
export function markAutoBetStopRequested(state: AutoBetSessionState): AutoBetSessionState {
  if (state.status !== 'running' && state.status !== 'paused') return state;
  return { ...state, stopRequested: true, status: 'stopping' };
}

/**
 * Pure step after one settled fire. Count / stop-loss / stop-profit / martingale
 * use only `state` — never React closures.
 */
export function stepAutoBetSession(
  state: AutoBetSessionState,
  outcome: AutoBetFireOutcome,
): AutoBetStepResult {
  const { config } = state;

  let nextProfit: string;
  try {
    nextProfit = toDecimal(state.cumulativeProfit, 'profit')
      .add(toDecimal(outcome.profitDelta, 'delta'))
      .toFixed();
  } catch {
    nextProfit = state.cumulativeProfit;
  }

  const nextStake = adjustStake(
    config.baseStake,
    state.nextStake,
    outcome.won ? config.onWinMode : config.onLossMode,
    outcome.won ? config.onWinIncreasePercent : config.onLossIncreasePercent,
  );

  const nextRemaining = state.remaining === null ? null : Math.max(0, state.remaining - 1);
  const nextFires = state.firesPlaced + 1;

  let shouldStop = state.stopRequested || (nextRemaining !== null && nextRemaining <= 0);

  if (!shouldStop && isPositiveDecimal(config.stopOnProfit)) {
    try {
      shouldStop = toDecimal(nextProfit, 'profit').gte(
        toDecimal(config.stopOnProfit, 'stopProfit'),
      );
    } catch {
      // ignore malformed stopOnProfit
    }
  }

  if (!shouldStop && isPositiveDecimal(config.stopOnLoss)) {
    try {
      shouldStop = toDecimal(nextProfit, 'profit').lte(
        toDecimal(config.stopOnLoss, 'stopLoss').neg(),
      );
    } catch {
      // ignore malformed stopOnLoss
    }
  }

  if (shouldStop) {
    return {
      decision: 'stop',
      state: {
        ...state,
        status: 'idle',
        remaining: nextRemaining,
        cumulativeProfit: nextProfit,
        firesPlaced: nextFires,
        nextStake,
        stopRequested: false,
      },
    };
  }

  return {
    decision: 'continue',
    state: {
      ...state,
      status: 'running',
      remaining: nextRemaining,
      cumulativeProfit: nextProfit,
      firesPlaced: nextFires,
      nextStake,
    },
  };
}

function toQueueState(session: AutoBetSessionState | null, fallbackStake: string): AutoBetQueueState {
  if (!session) {
    return {
      status: 'idle',
      remaining: null,
      cumulativeProfit: '0',
      firesPlaced: 0,
      nextStake: fallbackStake,
    };
  }
  return {
    status: session.status,
    remaining: session.remaining,
    cumulativeProfit: session.cumulativeProfit,
    firesPlaced: session.firesPlaced,
    nextStake: session.nextStake,
  };
}

export function useAutoBetQueue(initialStake: string) {
  const [status, setStatus] = useState<AutoBetQueueStatus>('idle');
  const [remaining, setRemaining] = useState<number | null>(null);
  const [cumulativeProfit, setCumulativeProfit] = useState('0');
  const [firesPlaced, setFiresPlaced] = useState(0);
  const [nextStake, setNextStake] = useState(initialStake);
  /** Double-Start guard — true while a session owns the loop. */
  const sessionActiveRef = useRef(false);
  const sessionRef = useRef<AutoBetSessionState | null>(null);
  const stopRequestedRef = useRef(false);

  const mirror = useCallback((session: AutoBetSessionState | null, fallbackStake = initialStake) => {
    const snap = toQueueState(session, fallbackStake);
    setStatus(snap.status);
    setRemaining(snap.remaining);
    setCumulativeProfit(snap.cumulativeProfit);
    setFiresPlaced(snap.firesPlaced);
    setNextStake(snap.nextStake);
  }, [initialStake]);

  const snapshot = useCallback((): AutoBetQueueState => {
    return { status, remaining, cumulativeProfit, firesPlaced, nextStake };
  }, [cumulativeProfit, firesPlaced, nextStake, remaining, status]);

  const reset = useCallback(
    (stake = initialStake) => {
      stopRequestedRef.current = false;
      sessionActiveRef.current = false;
      sessionRef.current = null;
      mirror(null, stake);
    },
    [initialStake, mirror],
  );

  const start = useCallback(
    (config: AutoBetConfig): boolean => {
      if (sessionActiveRef.current) return false;
      const session = createAutoBetSession(config);
      if (!session) return false;
      sessionActiveRef.current = true;
      stopRequestedRef.current = false;
      sessionRef.current = session;
      mirror(session);
      return true;
    },
    [mirror],
  );

  /** Mirror pure loop state into UI; clears active when idle. */
  const syncSession = useCallback(
    (session: AutoBetSessionState) => {
      sessionRef.current = session.status === 'idle' ? null : session;
      if (session.status === 'idle') {
        sessionActiveRef.current = false;
        stopRequestedRef.current = false;
      } else if (session.stopRequested) {
        stopRequestedRef.current = true;
      }
      mirror(session);
    },
    [mirror],
  );

  const requestStop = useCallback(() => {
    if (!sessionActiveRef.current) return;
    const current = sessionRef.current;
    if (!current) return;
    if (current.status !== 'running' && current.status !== 'paused') return;
    stopRequestedRef.current = true;
    const next = markAutoBetStopRequested(current);
    sessionRef.current = next;
    mirror(next);
  }, [mirror]);

  const isStopRequested = useCallback(() => stopRequestedRef.current, []);

  const pause = useCallback(() => {
    const current = sessionRef.current;
    if (!current || current.status !== 'running') return;
    const next = { ...current, status: 'paused' as const };
    sessionRef.current = next;
    mirror(next);
  }, [mirror]);

  const resume = useCallback(() => {
    const current = sessionRef.current;
    if (!current || current.status !== 'paused') return;
    if (stopRequestedRef.current) {
      const next = markAutoBetStopRequested(current);
      sessionRef.current = next;
      mirror(next);
      return;
    }
    const next = { ...current, status: 'running' as const };
    sessionRef.current = next;
    mirror(next);
  }, [mirror]);

  /** Hook convenience — steps via sessionRef (tests / sync callers). Prefer shell local + stepAutoBetSession. */
  const recordFire = useCallback(
    (outcome: AutoBetFireOutcome): 'continue' | 'stop' => {
      const current = sessionRef.current;
      if (!current) return 'stop';
      const withStop = stopRequestedRef.current
        ? markAutoBetStopRequested(current)
        : current;
      const { state, decision } = stepAutoBetSession(withStop, outcome);
      sessionRef.current = decision === 'stop' ? null : state;
      if (decision === 'stop') {
        sessionActiveRef.current = false;
        stopRequestedRef.current = false;
      }
      mirror(state);
      return decision;
    },
    [mirror],
  );

  return {
    status,
    remaining,
    cumulativeProfit,
    firesPlaced,
    nextStake,
    snapshot,
    canStart: canStartAutoBet,
    start,
    syncSession,
    requestStop,
    isStopRequested,
    pause,
    resume,
    recordFire,
    reset,
    isActive: status === 'running' || status === 'stopping' || status === 'paused',
    sessionActive: () => sessionActiveRef.current,
  };
}
