import type { GameCode } from '@phonara/game-engine';
import type { ImportedGameComponent } from './types';

export type ImportedGameModule = { ImportedGame: ImportedGameComponent };

/** Code-split loaders — swap paste targets under each `components/games/{game}/` folder. */
export const IMPORTED_GAME_LOADERS: Record<GameCode, () => Promise<ImportedGameModule>> = {
  crash: () => import('./crash').then((m) => ({ ImportedGame: m.ImportedCrashGame })),
  dice: () => import('./dice').then((m) => ({ ImportedGame: m.ImportedDiceGame })),
  mines: () => import('./mines').then((m) => ({ ImportedGame: m.ImportedMinesGame })),
  plinko: () => import('./plinko').then((m) => ({ ImportedGame: m.ImportedPlinkoGame })),
  limbo: () => import('./limbo').then((m) => ({ ImportedGame: m.ImportedLimboGame })),
  hilo: () => import('./hilo').then((m) => ({ ImportedGame: m.ImportedHiloGame })),
};

export const GAME_CODES = Object.keys(IMPORTED_GAME_LOADERS) as GameCode[];
