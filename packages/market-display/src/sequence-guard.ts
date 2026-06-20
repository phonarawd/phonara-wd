import type { BookDelta, BookSnapshot } from "./order-book-types";

export type SequenceGuardState = {
  lastUpdateId: number;
  /** True when a gap was detected and caller should REST reseed. */
  needsReseed: boolean;
};

export function createSequenceGuard(snapshot: BookSnapshot): SequenceGuardState {
  return { lastUpdateId: snapshot.lastUpdateId, needsReseed: false };
}

/**
 * Binance depth stream: apply delta only when U <= lastUpdateId+1 <= u.
 * Gap → needsReseed (REST depth snapshot required).
 */
export function applyBookDelta(
  state: SequenceGuardState,
  delta: BookDelta,
): SequenceGuardState {
  const expected = state.lastUpdateId + 1;
  if (delta.u < expected) {
    return state;
  }
  if (delta.U > expected) {
    return { ...state, needsReseed: true };
  }
  return { lastUpdateId: delta.u, needsReseed: false };
}
