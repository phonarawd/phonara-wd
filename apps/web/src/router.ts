import { createRouter } from '@tanstack/react-router';
import { Route as rootRoute } from './routes/__root';
import { Route as indexRoute } from './routes/index';
import { Route as loginRoute } from './routes/login';
import { Route as signupRoute } from './routes/signup';
import { Route as resetPasswordRoute } from './routes/reset-password';
import { Route as gamesRoute } from './routes/games';
import { Route as gamesHistoryRoute } from './routes/games-history';
import { Route as gamesFairnessRoute } from './routes/games-fairness';
import { Route as gamesTournamentsRoute } from './routes/games-tournaments';
import { Route as aboutRoute } from './routes/about';
import { Route as termsRoute } from './routes/terms';
import { Route as privacyRoute } from './routes/privacy';
import { Route as dashboardRoute } from './routes/dashboard';
import { Route as ledgerRoute } from './routes/ledger';
import { Route as tradeRoute } from './routes/trade';
import { Route as stakingRoute } from './routes/staking';
import {
  casinoIndexRoute,
  casinoCrashRoute,
  casinoLimboRoute,
  casinoDiceRoute,
  casinoMinesRoute,
  casinoHiloRoute,
  casinoPlinkoRoute,
  casinoMintReelsRoute,
  casinoGoldRushRoute,
  casinoRouletteRoute,
  casinoBlackjackRoute,
  casinoDeepshaftRoute,
  casinoMomentumRoute,
  casinoFairnessRoute,
} from './routes/casino';
import { Route as walletRoute } from './routes/wallet';
import {
  earnLayoutRoute,
  earnIndexRoute,
  earnMissionsRoute,
} from './routes/earn';
import { Route as moreRoute } from './routes/more';
import { Route as homeRoute } from './routes/home';
import { Route as accountRoute } from './routes/account';
import { Route as settingsRoute } from './routes/settings';
import { Route as referralRoute } from './routes/referral';
import { Route as responsibleGamingRoute } from './routes/responsible-gaming';
import { Route as sportsRoute } from './routes/sports';
import { Route as installRoute } from './routes/install';
import { Route as faqRoute } from './routes/faq';
import { Route as partnerRoute } from './routes/partner';
import { Route as shareRoundRoute } from './routes/share-round';

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  signupRoute,
  resetPasswordRoute,
  gamesRoute,
  gamesHistoryRoute,
  gamesFairnessRoute,
  gamesTournamentsRoute,
  aboutRoute,
  termsRoute,
  privacyRoute,
  dashboardRoute,
  ledgerRoute,
  tradeRoute,
  stakingRoute,
  walletRoute,
  earnLayoutRoute.addChildren([earnIndexRoute, earnMissionsRoute]),
  moreRoute,
  homeRoute,
  accountRoute,
  settingsRoute,
  referralRoute,
  responsibleGamingRoute,
  sportsRoute,
  installRoute,
  faqRoute,
  partnerRoute,
  shareRoundRoute,
  casinoIndexRoute,
  casinoCrashRoute,
  casinoLimboRoute,
  casinoDiceRoute,
  casinoMinesRoute,
  casinoHiloRoute,
  casinoPlinkoRoute,
  casinoMintReelsRoute,
  casinoGoldRushRoute,
  casinoRouletteRoute,
  casinoBlackjackRoute,
  casinoDeepshaftRoute,
  casinoMomentumRoute,
  casinoFairnessRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
