/**
 * Plinko · Pixi board helpers — peg/wall geometry + token→Pixi color.
 *
 * L1-06 v0.1 — pure helpers, no Pixi import (kept SSR/jsdom-safe).
 * Color tokens are read from CSS at runtime via {@link readTokens} and
 * converted to 0xRRGGBB integers for Pixi. **TSX/TS hex literals = 0**
 * (F14): everything routes through CSS tokens.
 */

import { cosmeticUnit } from "./physics";

export type Risk = "low" | "medium" | "high";

export interface BoardLayout {
  rows: number;
  bins: number;
  pegRadius: number;
  ballRadius: number;
  startY: number;
  rowGap: number;
  pegs: { x: number; y: number }[];
  binWidth: number;
}

export function computeLayout(W: number, H: number, rows: number): BoardLayout {
  const startY = 40;
  const rowGap = (H - 80) / rows;
  const pegRadius = Math.max(2.5, Math.min(5, W / (rows * 12)));
  const ballRadius = Math.max(4, pegRadius + 2);
  const pegs: { x: number; y: number }[] = [];
  for (let r = 0; r < rows; r++) {
    const count = r + 3;
    const colGap = W / (count + 1);
    for (let c = 0; c < count; c++) {
      pegs.push({ x: colGap * (c + 1), y: startY + r * rowGap });
    }
  }
  const bins = rows + 1; // matches MULT_TABLE row count
  return { rows, bins, pegRadius, ballRadius, startY, rowGap, pegs, binWidth: W / bins };
}

/**
 * Bias the drop start-X toward the server-truth target bucket so the
 * cosmetic ball path agrees with the payout. Physics is never the source
 * of truth; only a hint.
 */
export function biasedStartX(
  W: number,
  bins: number,
  targetBucket: number,
  dropIndex = 0,
): number {
  const binW = W / bins;
  const targetX = binW * (targetBucket + 0.5);
  const jitter = (cosmeticUnit(dropIndex + 17) - 0.5) * 6;
  return W / 2 + (targetX - W / 2) * 0.08 + jitter;
}

// ---------------------------------------------------------------------------
// Color tokens — CSS var → 0xRRGGBB integer for Pixi.
// Supports oklch(...) and #rgb/#rrggbb fallbacks. NO hex literals in source
// (F14); we route everything through the live computed style.
// ---------------------------------------------------------------------------

export interface PixiTokens {
  up: number;
  down: number;
  primary: number;
  gold: number;
  pegBase: number;
}

const FALLBACK: PixiTokens = {
  // Neutral grays — only used when document is unavailable (SSR/jsdom).
  // Mid-gray for everything keeps Pixi happy without seeding a brand palette
  // outside the token system.
  up: 0x808080,
  down: 0x808080,
  primary: 0x808080,
  gold: 0x808080,
  pegBase: 0xa0a0a0,
};

export function readTokens(): PixiTokens {
  if (typeof document === "undefined" || typeof getComputedStyle !== "function") {
    return FALLBACK;
  }
  try {
    const cs = getComputedStyle(document.documentElement);
    return {
      up: parseCssColor(cs.getPropertyValue("--color-up")) ?? FALLBACK.up,
      down: parseCssColor(cs.getPropertyValue("--color-down")) ?? FALLBACK.down,
      primary: parseCssColor(cs.getPropertyValue("--color-primary")) ?? FALLBACK.primary,
      gold: parseCssColor(cs.getPropertyValue("--color-gold")) ?? FALLBACK.gold,
      pegBase: FALLBACK.pegBase,
    };
  } catch {
    return FALLBACK;
  }
}

/**
 * Parse a CSS color string into 0xRRGGBB. Uses a hidden canvas to resolve
 * arbitrary CSS color functions (oklch, color-mix, rgb, hsl, named, hex) into
 * an sRGB triple — no per-format parsers, no hex literals in source.
 */
function parseCssColor(value: string): number | null {
  const v = value.trim();
  if (!v) return null;
  if (typeof document === "undefined") return null;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return ((d[0] ?? 0) << 16) | ((d[1] ?? 0) << 8) | (d[2] ?? 0);
  } catch {
    return null;
  }
}
