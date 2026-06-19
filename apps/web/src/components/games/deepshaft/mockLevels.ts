/**
 * MOCK · replaced by engine.evaluateDeepshaft — decorative, never engine truth.
 *
 * Deterministic per-(commitment hash + targetDepth + tier) reveal pattern
 * used ONLY when `bet.result.levels` is absent in Lovable preview
 * (e.g. pre-bet/idle state). Settle banner NEVER consumes this — the
 * Stage reads `totalMultiplier` / `won` / `caveIn` from `bet.result`
 * exclusively.
 *
 * LAW 4 FULL: the array returned here is decorative. It is consumed
 * inside Stage's closure and resolved into per-cell `"hidden" |
 * "revealed-gold" | "revealed-cavein"` strings before reaching
 * <ShaftCell />. The full array never crosses the cell-prop boundary.
 */
import type {
  DeepshaftLevel,
  DeepshaftSelection,
} from "@/games/shared/types";

function hashSeed(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TIER_CAVEIN_P: Record<DeepshaftSelection["riskTier"], number> = {
  safe: 0.18,
  standard: 0.32,
  deep: 0.5,
};

/**
 * MOCK only — replaced by engine.evaluateDeepshaft at paste time.
 *
 * Returns a decorative `levels[]` sized to `targetDepth`. May terminate
 * early with a cavein. Never used for win/loss banner.
 */
export function mockLevels(
  selection: DeepshaftSelection,
  seedHash: string | null | undefined,
): DeepshaftLevel[] {
  const depth = Math.max(1, Math.min(15, Math.floor(selection.targetDepth)));
  const seedString = `${seedHash ?? "idle"}|${selection.riskTier}|${depth}`;
  const rng = mulberry32(hashSeed(seedString));
  const cavePcaveinP = TIER_CAVEIN_P[selection.riskTier];
  const out: DeepshaftLevel[] = [];
  for (let i = 0; i < depth; i++) {
    if (rng() < cavePcaveinP) {
      out.push({ kind: "cavein" });
      return out;
    }
    const step =
      selection.riskTier === "deep"
        ? 0.6
        : selection.riskTier === "standard"
          ? 0.35
          : 0.18;
    const level = 1 + (i + 1) * step;
    out.push({ kind: "gold", levelMultiplier: level.toFixed(2) });
  }
  return out;
}
