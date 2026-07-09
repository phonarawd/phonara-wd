/**
 * Coalesce high-frequency market-data emits to ~20fps.
 * Main thread: rAF flush keeps INP low. Workers: setTimeout (no requestAnimationFrame).
 */
export const MARKET_DATA_EMIT_INTERVAL_MS = 50;

export type RafBatcher = {
  schedule: () => void;
  cancel: () => void;
};

type FrameHandle = number | ReturnType<typeof setTimeout>;

function canUseRequestAnimationFrame(): boolean {
  return (
    typeof globalThis.requestAnimationFrame === 'function' &&
    typeof globalThis.document !== 'undefined'
  );
}

export function createRafBatcher(
  onFlush: () => void,
  minIntervalMs = MARKET_DATA_EMIT_INTERVAL_MS,
): RafBatcher {
  const useRaf = canUseRequestAnimationFrame();
  let frameId: FrameHandle | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastFlush = -Infinity;

  const flush = () => {
    frameId = null;
    timeoutId = null;
    lastFlush = performance.now();
    onFlush();
  };

  const scheduleFrame = () => {
    if (frameId !== null) return;
    frameId = useRaf ? globalThis.requestAnimationFrame(flush) : globalThis.setTimeout(flush, 0);
  };

  const schedule = () => {
    const now = performance.now();
    const elapsed = now - lastFlush;

    if (elapsed >= minIntervalMs) {
      scheduleFrame();
      return;
    }

    if (timeoutId !== null) return;
    timeoutId = globalThis.setTimeout(() => {
      timeoutId = null;
      scheduleFrame();
    }, minIntervalMs - elapsed);
  };

  const cancel = () => {
    if (frameId !== null) {
      if (useRaf) {
        globalThis.cancelAnimationFrame(frameId as number);
      } else {
        globalThis.clearTimeout(frameId);
      }
    }
    if (timeoutId !== null) globalThis.clearTimeout(timeoutId);
    frameId = null;
    timeoutId = null;
  };

  return { schedule, cancel };
}
