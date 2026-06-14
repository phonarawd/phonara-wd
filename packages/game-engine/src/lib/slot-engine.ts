import { requireFloat } from './require-float';

/** Wild substitutes any paying symbol except itself for line matching. */
export const SLOT_WILD = 7;

export type PaylineRow = readonly [number, number, number, number, number];

/** Standard 20 paylines on a 3×5 grid (row index 0–2 per column). */
export const PAYLINES_20: readonly PaylineRow[] = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  [0, 0, 1, 0, 0],
  [2, 2, 1, 2, 2],
  [1, 0, 0, 0, 1],
  [1, 2, 2, 2, 1],
  [0, 1, 1, 1, 0],
  [2, 1, 1, 1, 2],
  [1, 1, 0, 1, 1],
  [1, 1, 2, 1, 1],
  [0, 1, 0, 1, 0],
  [2, 1, 2, 1, 2],
  [1, 0, 1, 0, 1],
  [1, 2, 1, 2, 1],
  [0, 0, 2, 0, 0],
  [2, 2, 0, 2, 2],
  [0, 2, 2, 2, 0],
];

export interface SlotLineWin {
  lineIndex: number;
  symbol: number;
  count: number;
  multiplier: number;
}

export interface SlotSpinResult {
  stops: number[];
  window: number[][];
  lineWins: SlotLineWin[];
  totalMultiplier: number;
}

export interface SlotConfig {
  readonly reels: readonly (readonly number[])[];
  /** symbol id → [3-of-kind, 4-of-kind, 5-of-kind] multipliers */
  readonly paytable: Readonly<Record<number, readonly [number, number, number]>>;
  readonly maxJackpotMultiplier: number;
}

export function reelStopFromFloat(stripLength: number, f: number): number {
  return Math.floor(f * stripLength);
}

export function buildSlotWindow(
  reels: readonly (readonly number[])[],
  stops: readonly number[],
): number[][] {
  const window: number[][] = [[], [], []];
  for (let col = 0; col < 5; col += 1) {
    const strip = reels[col]!;
    const stop = stops[col]!;
    for (let row = 0; row < 3; row += 1) {
      const idx = (stop + row) % strip.length;
      window[row]![col] = strip[idx]!;
    }
  }
  return window;
}

function resolveLineSymbol(symbols: number[]): number | null {
  let base: number | null = null;
  for (const sym of symbols) {
    if (sym === SLOT_WILD) continue;
    base = sym;
    break;
  }
  if (base === null) return null;
  return base;
}

function countLineMatch(symbols: number[], base: number): number {
  let count = 0;
  for (const sym of symbols) {
    if (sym === base || sym === SLOT_WILD) count += 1;
    else break;
  }
  return count;
}

export function evaluateLine(
  symbols: number[],
  paytable: Readonly<Record<number, readonly [number, number, number]>>,
): { symbol: number; count: number; multiplier: number } {
  const base = resolveLineSymbol(symbols);
  if (base === null) return { symbol: SLOT_WILD, count: 0, multiplier: 0 };
  const count = countLineMatch(symbols, base);
  if (count < 3) return { symbol: base, count, multiplier: 0 };
  const tier = paytable[base];
  if (!tier) return { symbol: base, count, multiplier: 0 };
  const mult = tier[count - 3] ?? 0;
  return { symbol: base, count, multiplier: mult };
}

export function spinSlot(
  config: SlotConfig,
  floats: number[],
  activeLines: number,
): SlotSpinResult {
  if (activeLines < 1 || activeLines > PAYLINES_20.length) {
    throw new Error('invalid_slot_lines');
  }

  const stops = config.reels.map((strip, i) =>
    reelStopFromFloat(strip.length, requireFloat(floats, i)),
  );
  const window = buildSlotWindow(config.reels, stops);
  const lineWins: SlotLineWin[] = [];
  let totalMultiplier = 0;

  for (let li = 0; li < activeLines; li += 1) {
    const line = PAYLINES_20[li]!;
    const symbols = line.map((row, col) => window[row]![col]!);
    const win = evaluateLine(symbols, config.paytable);
    if (win.multiplier > 0) {
      lineWins.push({ lineIndex: li, ...win });
      totalMultiplier += win.multiplier;
    }
  }

  return { stops, window, lineWins, totalMultiplier };
}

/** Closed-form RTP: Σ P(line win) × multiplier / activeLines (uniform reel independence approx). */
export function slotTheoreticalRtp(config: SlotConfig, activeLines: number): number {
  let ev = 0;
  for (let li = 0; li < activeLines; li += 1) {
    const line = PAYLINES_20[li]!;
    for (const [sym, tiers] of Object.entries(config.paytable)) {
      const symbol = Number(sym);
      for (let kind = 3; kind <= 5; kind += 1) {
        const mult = tiers[kind - 3] ?? 0;
        if (mult <= 0) continue;
        const p = lineWinProbability(config.reels, line, symbol, kind);
        ev += p * mult;
      }
    }
  }
  return ev / activeLines;
}

function symbolProbOnCell(reels: readonly (readonly number[])[], col: number, sym: number): number {
  const strip = reels[col]!;
  const hits = strip.filter((s) => s === sym || s === SLOT_WILD).length;
  return hits / strip.length;
}

function lineWinProbability(
  reels: readonly (readonly number[])[],
  line: PaylineRow,
  symbol: number,
  count: number,
): number {
  let p = 1;
  for (let col = 0; col < count; col += 1) {
    p *= symbolProbOnCell(reels, col, symbol);
  }
  if (count < 5) {
    const missCol = count;
    const strip = reels[missCol]!;
    const miss = strip.filter((s) => s !== symbol && s !== SLOT_WILD).length / strip.length;
    p *= miss;
  }
  return p;
}

export function slotPayoutMultiplier(totalLineMultiplier: number, activeLines: number): number {
  return totalLineMultiplier / activeLines;
}
