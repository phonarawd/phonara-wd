import type { GameCode } from '@phonara/game-engine';

/** Mirrors Lovable `useMockPipeline.resetAccumulatedSelection` (§1-H). */
export function resetAccumulatedSelection(
  gameCode: GameCode,
  prev: Record<string, unknown>,
): Record<string, unknown> {
  if (gameCode === 'mines') {
    return { ...prev, revealedCells: [] };
  }
  if (gameCode === 'hilo') {
    return { ...prev, guesses: [], startCard: null };
  }
  return prev;
}

/** Delay after settle before clearing mines/hilo accumulated selection (Lovable parity). */
export const ACCUMULATED_SELECTION_RESET_MS = 400;
