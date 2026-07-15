export type DominantRamConsumer = 'cursor' | 'claude' | 'mixed' | 'none';

/** Minimum MB before an app can be considered dominant (single SOT — do not inline elsewhere). */
export const DOMINANT_MIN_MB = 800;

/** smaller/larger >= MIXED_RATIO → mixed (larger/smaller < 1/MIXED_RATIO). */
export const MIXED_RATIO = 0.75;

const DOMINANCE_FACTOR = 1 / MIXED_RATIO;

export function dominantRamConsumer(cursorMb: number, claudeMb: number): DominantRamConsumer {
  if (cursorMb < DOMINANT_MIN_MB && claudeMb < DOMINANT_MIN_MB) return 'none';
  if (cursorMb >= claudeMb * DOMINANCE_FACTOR && cursorMb >= DOMINANT_MIN_MB) return 'cursor';
  if (claudeMb >= cursorMb * DOMINANCE_FACTOR && claudeMb >= DOMINANT_MIN_MB) return 'claude';
  return 'mixed';
}
