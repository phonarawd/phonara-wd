/**
 * motion.dev spring presets + semantic durations — §25.3 L-B (only these two springs).
 */

/** Semantic motion durations (ms) — mirror motion.css SOT. */
export const MOTION_MS = {
  press: 120,
  field: 150,
  toggle: 150,
  surface: 200,
  overlay: 320,
  /** L-B page enter budget (≤250ms) — not an L-A CSS token. */
  pageEnter: 250,
  /** Signal Pulse count-up (≤400ms · §34.15) — L1; L2/reduced = 0 via useCountUp. */
  countUp: 400,
} as const;

export const motionMsToSec = (ms: number): number => ms / 1000;

export const SPRING_SNAPPY = { type: 'spring', stiffness: 420, damping: 32 } as const;

export const SPRING_GENTLE = { type: 'spring', stiffness: 260, damping: 30 } as const;
