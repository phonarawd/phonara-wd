// ─── Fairness core ────────────────────────────────────────────────────────────
export { generateServerSeed, hashServerSeed } from './fairness/seed';
export { hmacSha256 } from './fairness/hmac';
export { floatStream, singleFloat } from './fairness/float';
export {
  assertPfGoldenCoverageComplete,
  PF_BOUNDARY_FORMULA_VECTORS,
  PF_FLOAT_HALF,
  PF_FLOAT_MAX,
  PF_FLOAT_MIN,
  PF_GOLDEN_SEED,
  PF_GOLDEN_SEED_FLOATS,
  PF_SEED_RESULT_VECTORS,
  pfGoldenBoundaryCoverage,
  pfGoldenSeedCoverage,
} from './fairness/pf-golden-vectors';
export { quantize6, quantize6String } from './lib/quantize';
export {
  recomputeResult,
  verifyRound,
  type VerifyInput,
  type VerifyResult,
} from './fairness/verifier';

// ─── Plugin registry ──────────────────────────────────────────────────────────
export {
  GAME_CODES,
  GAME_REGISTRY,
  registerGame,
  getGame,
  listGames,
  isRegisteredGame,
  type GameCode,
  type GameDefinition,
} from './registry';

export { runRtpHarness, assertRtpHarness, type RtpHarnessResult } from './lib/rtp-harness';

// ─── Game modules (registers at import time) ──────────────────────────────────
export * from './games/crash';
export * from './games/limbo';
export * from './games/dice';
export * from './games/mines';
export * from './games/hilo';
export * from './games/plinko';
export * from './games/mint-reels';
export * from './games/gold-rush';
export * from './games/roulette';
export * from './games/blackjack';
export * from './games/deepshaft';
export * from './games/momentum';
