/**
 * seedToGrid — UI-only deterministic grid generator for slot Stage animations.
 *
 * PHONARA hard contract: the casino engine settles slots and returns ONLY
 * `{ totalMultiplier }` in `bet.result`. There is NO `bet.result.grid`.
 * Stage components must therefore animate reels using a deterministic
 * seed-derived sequence so the visual is reproducible per round, while the
 * settlement multiplier remains the sole source of truth for win tier.
 *
 * Security:
 *  - Uses `server_seed_hash` (commit value, publicly broadcast at round
 *    open) + `clientSeed` + `nonce`. We never touch the raw `server_seed`
 *    before reveal.
 *  - This function is COSMETIC. Do not use the returned grid for any
 *    payout / win-line / multiplier decision. Display only.
 *
 * Algorithm: xorshift32 seeded by the byte-mixed string `${hash}:${client}:${nonce}`.
 * No Web Crypto required → sync, no async state plumbing in Stage.
 */

export interface SeedToGridParams {
  /** `commitment.server_seed_hash` — 64-char hex string from PHONARA RPC. */
  serverSeedHash: string | null | undefined;
  /** User-controlled client seed (any string). */
  clientSeed: string | null | undefined;
  /** Per-spin nonce. Use a local tick counter when commitment hash is stable. */
  nonce: number;
  /** Modulo applied to each cell (e.g. number of symbols). */
  modulo: number;
  /** Total cells (rows * cols). */
  length: number;
}

function hashStringTo32(s: string): number {
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function xorshift32(seed: number): () => number {
  let x = seed || 0x9e3779b9;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 0xffffffff;
  };
}

export function seedToGrid({
  serverSeedHash,
  clientSeed,
  nonce,
  modulo,
  length,
}: SeedToGridParams): number[] {
  const key = `${serverSeedHash ?? "idle"}:${clientSeed ?? "anon"}:${nonce}`;
  const seed = hashStringTo32(key);
  const rng = xorshift32(seed);
  const out = new Array<number>(length);
  for (let i = 0; i < length; i++) {
    out[i] = Math.floor(rng() * modulo);
  }
  return out;
}
