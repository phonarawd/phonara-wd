import type { GameCode } from '@phonara/game-engine';
import type { ImportedGameComponent } from './types';

export type ImportedGameModule = { ImportedGame: ImportedGameComponent };

const asModule = (ImportedGame: ImportedGameComponent): ImportedGameModule => ({
  ImportedGame,
});

/** Code-split loaders — swap paste targets under each `components/games/{game}/` folder. */
export const IMPORTED_GAME_LOADERS: Record<GameCode, () => Promise<ImportedGameModule>> = {
  crash: () => import('./crash').then((m) => asModule(m.ImportedCrashGame as ImportedGameComponent)),
  dice: () => import('./dice').then((m) => asModule(m.ImportedDiceGame as ImportedGameComponent)),
  mines: () => import('./mines').then((m) => asModule(m.ImportedMinesGame as ImportedGameComponent)),
  plinko: () => import('./plinko').then((m) => asModule(m.ImportedPlinkoGame as ImportedGameComponent)),
  limbo: () => import('./limbo').then((m) => asModule(m.ImportedLimboGame as ImportedGameComponent)),
  hilo: () => import('./hilo').then((m) => asModule(m.ImportedHiloGame as ImportedGameComponent)),
  mint_reels: () =>
    import('./mint-reels').then((m) => asModule(m.ImportedMintReelsGame as ImportedGameComponent)),
  gold_rush: () =>
    import('./gold-rush').then((m) => asModule(m.ImportedGoldRushGame as ImportedGameComponent)),
  roulette: () =>
    import('./roulette').then((m) => asModule(m.ImportedRouletteGame as ImportedGameComponent)),
  blackjack: () =>
    import('./blackjack').then((m) => asModule(m.ImportedBlackjackGame as ImportedGameComponent)),
  deepshaft: () =>
    import('./deepshaft').then((m) => asModule(m.ImportedDeepshaftGame as ImportedGameComponent)),
  momentum: () =>
    import('./momentum').then((m) => asModule(m.ImportedMomentumGame as ImportedGameComponent)),
};

export const GAME_CODES = Object.keys(IMPORTED_GAME_LOADERS) as GameCode[];
