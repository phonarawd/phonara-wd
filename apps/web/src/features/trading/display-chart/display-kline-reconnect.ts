/**
 * Display-only kline WS provider selection and Binance primary return (M-5).
 * Reconnect delay uses shared worker backoff — settlement unaffected.
 */
export {
  computeReconnectDelayMs,
  createReconnectScheduler,
  DEFAULT_RECONNECT_BASE_DELAY_MS,
  DEFAULT_RECONNECT_MAX_DELAY_MS,
  type ReconnectScheduler,
} from '@/workers/market-data-reconnect';

export type KlineFeedProvider = 'binance' | 'bybit';

/** Stable Bybit session before retrying Binance primary (display-only). */
export const KLINE_BINANCE_RETURN_AFTER_MS = 5 * 60 * 1000;

export type KlineProviderState = {
  provider: KlineFeedProvider;
  /** Active WS session open time for the current provider. */
  connectedAtMs: number | null;
};

export function createInitialKlineProviderState(): KlineProviderState {
  return { provider: 'binance', connectedAtMs: null };
}

export function noteKlineWsConnected(
  state: KlineProviderState,
  nowMs = Date.now(),
): KlineProviderState {
  return { ...state, connectedAtMs: nowMs };
}

export function noteKlineWsDisconnected(state: KlineProviderState): KlineProviderState {
  return { ...state, connectedAtMs: null };
}

/** Binance failure → Bybit fallback; Bybit failure stays on Bybit. */
export function advanceKlineProviderOnFailure(state: KlineProviderState): KlineProviderState {
  if (state.provider === 'binance') {
    return { provider: 'bybit', connectedAtMs: null };
  }
  return { ...state, connectedAtMs: null };
}

export function shouldReturnKlineToBinance(
  state: KlineProviderState,
  nowMs = Date.now(),
  stableMs = KLINE_BINANCE_RETURN_AFTER_MS,
): boolean {
  if (state.provider !== 'bybit') return false;
  if (state.connectedAtMs == null) return false;
  return nowMs - state.connectedAtMs >= stableMs;
}

export function resetKlineProviderToBinance(): KlineProviderState {
  return { provider: 'binance', connectedAtMs: null };
}

export type ResolveKlineConnectProviderInput = {
  state: KlineProviderState;
  /** Tab visible again or fresh subscription — retry Binance before Bybit. */
  preferPrimaryRetry?: boolean;
  nowMs?: number;
  stableMs?: number;
};

/** Pure provider pick for the next WS connect attempt. */
export function resolveKlineConnectProvider(input: ResolveKlineConnectProviderInput): {
  provider: KlineFeedProvider;
  state: KlineProviderState;
} {
  const nowMs = input.nowMs ?? Date.now();
  const stableMs = input.stableMs ?? KLINE_BINANCE_RETURN_AFTER_MS;

  if (input.preferPrimaryRetry && input.state.provider === 'bybit') {
    return { provider: 'binance', state: resetKlineProviderToBinance() };
  }

  if (shouldReturnKlineToBinance(input.state, nowMs, stableMs)) {
    return { provider: 'binance', state: resetKlineProviderToBinance() };
  }

  return { provider: input.state.provider, state: input.state };
}
