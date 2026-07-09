export const DEFAULT_WS_PING_INTERVAL_MS = 20_000;
export const DEFAULT_WS_PONG_TIMEOUT_MS = 10_000;
export const DEFAULT_WS_INACTIVITY_TIMEOUT_MS = 60_000;
export const DEFAULT_WS_ACTIVITY_CHECK_INTERVAL_MS = 5_000;

export function isWsInactivityExceeded(
  lastActivityAtMs: number | null,
  nowMs: number,
  thresholdMs: number,
): boolean {
  if (lastActivityAtMs == null) return false;
  return nowMs - lastActivityAtMs >= thresholdMs;
}

export function isBybitPongPayload(payload: Record<string, unknown>): boolean {
  if (payload['op'] === 'pong') return true;
  return payload['ret_msg'] === 'pong';
}

export type WsHeartbeatWatch = {
  touch: () => void;
  notePong: () => void;
  dispose: () => void;
};

export type WsHeartbeatMode = 'bybit-ping' | 'inactivity-only';

type TimerFns = {
  setInterval: typeof setInterval;
  clearInterval: typeof clearInterval;
  setTimeout: typeof setTimeout;
  clearTimeout: typeof clearTimeout;
};

export type CreateWsHeartbeatWatchOptions = {
  mode: WsHeartbeatMode;
  onStale: () => void;
  sendPing?: () => void;
  pingIntervalMs?: number;
  pongTimeoutMs?: number;
  inactivityTimeoutMs?: number;
  activityCheckIntervalMs?: number;
  now?: () => number;
  timers?: TimerFns;
};

export function createWsHeartbeatWatch(opts: CreateWsHeartbeatWatchOptions): WsHeartbeatWatch {
  const now = opts.now ?? (() => Date.now());
  const timers: TimerFns = opts.timers ?? {
    setInterval: globalThis.setInterval.bind(globalThis),
    clearInterval: globalThis.clearInterval.bind(globalThis),
    setTimeout: globalThis.setTimeout.bind(globalThis),
    clearTimeout: globalThis.clearTimeout.bind(globalThis),
  };

  let lastActivityAt: number | null = null;
  let pongTimer: ReturnType<typeof setTimeout> | null = null;
  let pingInterval: ReturnType<typeof setInterval> | null = null;
  let activityInterval: ReturnType<typeof setInterval> | null = null;
  let disposed = false;

  const clearPongTimer = () => {
    if (pongTimer != null) {
      timers.clearTimeout(pongTimer);
      pongTimer = null;
    }
  };

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    clearPongTimer();
    if (pingInterval != null) {
      timers.clearInterval(pingInterval);
      pingInterval = null;
    }
    if (activityInterval != null) {
      timers.clearInterval(activityInterval);
      activityInterval = null;
    }
  };

  const fireStale = () => {
    if (disposed) return;
    dispose();
    opts.onStale();
  };

  const touch = () => {
    lastActivityAt = now();
  };

  const notePong = () => {
    touch();
    clearPongTimer();
  };

  const schedulePongTimeout = () => {
    clearPongTimer();
    const pongTimeoutMs = opts.pongTimeoutMs ?? DEFAULT_WS_PONG_TIMEOUT_MS;
    pongTimer = timers.setTimeout(() => {
      pongTimer = null;
      fireStale();
    }, pongTimeoutMs);
  };

  const sendPingAndWatch = () => {
    if (disposed) return;
    opts.sendPing?.();
    schedulePongTimeout();
  };

  if (opts.mode === 'bybit-ping') {
    const pingIntervalMs = opts.pingIntervalMs ?? DEFAULT_WS_PING_INTERVAL_MS;
    pingInterval = timers.setInterval(sendPingAndWatch, pingIntervalMs);
  } else {
    const checkMs = opts.activityCheckIntervalMs ?? DEFAULT_WS_ACTIVITY_CHECK_INTERVAL_MS;
    const inactivityMs = opts.inactivityTimeoutMs ?? DEFAULT_WS_INACTIVITY_TIMEOUT_MS;
    activityInterval = timers.setInterval(() => {
      if (disposed) return;
      if (isWsInactivityExceeded(lastActivityAt, now(), inactivityMs)) {
        fireStale();
      }
    }, checkMs);
  }

  return { touch, notePong, dispose };
}
