/**
 * PHONARA L1-09 Phase 6 polish · shared primitive bits.
 * Single source of truth for the focus-ring tail repeated across
 * button / toggle / input / textarea primitives. Cosmetic dedup only —
 * the compiled class list is byte-identical to the previous inlined string.
 */
export const FOCUS_RING_BASE =
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
