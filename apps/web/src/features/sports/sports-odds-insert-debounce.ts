/**
 * PIR `pir-p1-sports-odds-debounce` — coalesce sports_odds_snapshots INSERT fanout.
 * Display-only: patches react-query caches; settlement RPCs unchanged.
 */

export const SPORTS_ODDS_INSERT_DEBOUNCE_MS = 500 as const;

export type SportsOddsInsertPatch = {
  readonly outcomeId: string;
  readonly odds: string;
  readonly capturedAt: string;
};

export type SportsOddsInsertDebouncer = {
  enqueue: (patch: SportsOddsInsertPatch) => void;
  flushNow: () => void;
  dispose: () => void;
  pendingCount: () => number;
};

type ScheduleHandle = { clear: () => void };

export type CreateSportsOddsInsertDebouncerOptions = {
  /** Trailing quiet window before flush. Must be ≥ {@link SPORTS_ODDS_INSERT_DEBOUNCE_MS}. */
  debounceMs?: number;
  flush: (patches: readonly SportsOddsInsertPatch[]) => void;
  now?: () => number;
  schedule?: (fn: () => void, ms: number) => ScheduleHandle;
};

function defaultSchedule(fn: () => void, ms: number): ScheduleHandle {
  const id = setTimeout(fn, ms);
  return { clear: () => clearTimeout(id) };
}

/**
 * Trailing debounce keyed by `outcomeId` — rapid INSERTs keep the latest odds only.
 * Flush emits a stable array (insertion order of first-seen outcome ids in the window).
 */
export function createSportsOddsInsertDebouncer(
  options: CreateSportsOddsInsertDebouncerOptions,
): SportsOddsInsertDebouncer {
  const debounceMs = options.debounceMs ?? SPORTS_ODDS_INSERT_DEBOUNCE_MS;
  if (debounceMs < SPORTS_ODDS_INSERT_DEBOUNCE_MS) {
    throw new Error(
      `sports-odds-insert-debounce: debounceMs must be ≥ ${SPORTS_ODDS_INSERT_DEBOUNCE_MS}`,
    );
  }

  const flush = options.flush;
  const schedule = options.schedule ?? defaultSchedule;
  const pending = new Map<string, SportsOddsInsertPatch>();
  const order: string[] = [];
  let timer: ScheduleHandle | null = null;
  let disposed = false;

  const clearTimer = () => {
    if (!timer) return;
    timer.clear();
    timer = null;
  };

  const flushNow = () => {
    clearTimer();
    if (pending.size === 0) return;
    const patches = order
      .map((id) => pending.get(id))
      .filter((row): row is SportsOddsInsertPatch => Boolean(row));
    pending.clear();
    order.length = 0;
    if (patches.length > 0) flush(patches);
  };

  return {
    enqueue(patch) {
      if (disposed) return;
      if (!pending.has(patch.outcomeId)) {
        order.push(patch.outcomeId);
      }
      pending.set(patch.outcomeId, patch);
      clearTimer();
      timer = schedule(flushNow, debounceMs);
    },
    flushNow,
    dispose() {
      disposed = true;
      clearTimer();
      pending.clear();
      order.length = 0;
    },
    pendingCount: () => pending.size,
  };
}
