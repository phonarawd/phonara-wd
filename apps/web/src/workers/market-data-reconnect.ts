export const DEFAULT_RECONNECT_BASE_DELAY_MS = 1_000;
export const DEFAULT_RECONNECT_MAX_DELAY_MS = 30_000;
export const DEFAULT_RECONNECT_JITTER_RATIO = 0.25;

export type ReconnectDelayOptions = {
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitterRatio?: number;
  random?: () => number;
};

/** Exponential backoff with jitter; capped at maxDelayMs (default 30s). */
export function computeReconnectDelayMs(attempt: number, opts: ReconnectDelayOptions = {}): number {
  const base = opts.baseDelayMs ?? DEFAULT_RECONNECT_BASE_DELAY_MS;
  const max = opts.maxDelayMs ?? DEFAULT_RECONNECT_MAX_DELAY_MS;
  const jitterRatio = opts.jitterRatio ?? DEFAULT_RECONNECT_JITTER_RATIO;
  const random = opts.random ?? Math.random;

  const exponent = Math.max(0, attempt);
  const exponential = Math.min(max, base * 2 ** exponent);
  const jitter = exponential * jitterRatio * random();
  return Math.min(max, Math.floor(exponential + jitter));
}

export function parseWsJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export type ReconnectScheduler = {
  schedule: (callback: () => void | Promise<void>) => void;
  reset: () => void;
  cancel: () => void;
};

export function createReconnectScheduler(opts: ReconnectDelayOptions = {}): ReconnectScheduler {
  let attempt = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let cancelled = false;

  const cancel = () => {
    if (timer != null) {
      clearTimeout(timer);
      timer = null;
    }
    cancelled = true;
  };

  const reset = () => {
    attempt = 0;
    cancelled = false;
    if (timer != null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const schedule = (callback: () => void | Promise<void>) => {
    if (cancelled || timer != null) return;
    const delay = computeReconnectDelayMs(attempt, opts);
    attempt += 1;
    timer = setTimeout(() => {
      timer = null;
      void callback();
    }, delay);
  };

  return { schedule, reset, cancel };
}
