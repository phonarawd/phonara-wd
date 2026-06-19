import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import type { GameCode } from '@phonara/game-engine';
import { CasinoLovableSurface } from '../presentation-import/casino/casino-lovable-surface';
import { PresentationRoot } from '../presentation-import/presentation-root';
import { ImportedCasinoPage } from '../presentation-import/pages/casino-page';
import { ImportedGamesFairnessPage } from '../presentation-import/pages/games-fairness-page';

export const casinoIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/casino',
  component: CasinoLobbyRoute,
});

function CasinoLobbyRoute() {
  return (
    <PresentationRoot>
      <ImportedCasinoPage />
    </PresentationRoot>
  );
}

export const casinoCrashRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/casino/crash',
  component: () => <CasinoPage initialGame="crash" />,
});

export const casinoLimboRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/casino/limbo',
  component: () => <CasinoPage initialGame="limbo" />,
});

export const casinoDiceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/casino/dice',
  component: () => <CasinoPage initialGame="dice" />,
});

export const casinoMinesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/casino/mines',
  component: () => <CasinoPage initialGame="mines" />,
});

export const casinoHiloRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/casino/hilo',
  component: () => <CasinoPage initialGame="hilo" />,
});

export const casinoPlinkoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/casino/plinko',
  component: () => <CasinoPage initialGame="plinko" />,
});

export const casinoMintReelsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/casino/mint-reels',
  component: () => <CasinoPage initialGame="mint_reels" />,
});

export const casinoGoldRushRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/casino/gold-rush',
  component: () => <CasinoPage initialGame="gold_rush" />,
});

export const casinoRouletteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/casino/roulette',
  component: () => <CasinoPage initialGame="roulette" />,
});

export const casinoBlackjackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/casino/blackjack',
  component: () => <CasinoPage initialGame="blackjack" />,
});

export const casinoDeepshaftRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/casino/deepshaft',
  component: () => <CasinoPage initialGame="deepshaft" />,
});

export const casinoMomentumRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/casino/momentum',
  component: () => <CasinoPage initialGame="momentum" />,
});

export const casinoFairnessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/casino/fairness',
  component: CasinoFairnessRoute,
});

function CasinoPage({ initialGame }: { initialGame: GameCode }) {
  return <CasinoLovableSurface initialGame={initialGame} />;
}

function CasinoFairnessRoute() {
  return (
    <PresentationRoot>
      <ImportedGamesFairnessPage />
    </PresentationRoot>
  );
}
