/**
 * P10 Sports hub pages — prematch · fixture detail · my-bets (§20.13.3 Sports#0).
 * ENGINE:exists — `rpc_list_sports_fixtures` · `rpc_get_fixture_markets` · `rpc_list_my_sports_bets`.
 * Multi-market board (totals/spread/…) = Sports#1 `p10-sports-parity-contract-and-board`.
 */

import type { MessageKey } from '@phonara/i18n';

import {
  SPORTS_FIXTURE_ROUTE_PREFIX,
  SPORTS_PRIMARY_ROUTE,
} from './sports-cashout-combo-display-contract';
import type { SportsPageMode } from './sports-page-display-contract';

export const P10_SPORTS_HUB_PAGES_TODO = 'p10-sports-hub-pages' as const;

export const P10_SPORTS_HUB_PAGES_PREREQUISITE_TODOS = [
  'p10-sports-fiat-hint-wire',
  'p10-page-sports',
] as const;

export const SPORTS_PREMATCH_ROUTE = '/sports/prematch' as const;
export const SPORTS_LIVE_ROUTE = '/sports/live' as const;
export const SPORTS_MY_BETS_ROUTE = '/sports/my-bets' as const;
export const SPORTS_RULES_ROUTE = '/sports/rules' as const;
export const SPORTS_VIP_ROUTE_HUB = '/sports/vip' as const;

/** Canonical fixture detail path builder — no client money math. */
export function sportsFixtureDetailPath(
  fixtureId: string,
): `${typeof SPORTS_FIXTURE_ROUTE_PREFIX}${string}` {
  return `${SPORTS_FIXTURE_ROUTE_PREFIX}${fixtureId}`;
}

/** Hub child routes registered in this todo (subnav + TanStack). Fixture is deep-link only. */
export const P10_SPORTS_HUB_REGISTERED_ROUTES = [
  SPORTS_PREMATCH_ROUTE,
  SPORTS_LIVE_ROUTE,
  SPORTS_MY_BETS_ROUTE,
  SPORTS_RULES_ROUTE,
  SPORTS_VIP_ROUTE_HUB,
] as const;

export const SPORTS_HUB_PAGE_MODES = [
  'home',
  'prematch',
  'live',
  'my-bets',
  'rules',
  'vip',
  'fixture',
] as const satisfies readonly SportsPageMode[];

export const SPORTS_HUB_ENGINE_RPCS = [
  'rpc_list_sports_fixtures',
  'rpc_get_fixture_markets',
  'rpc_list_my_sports_bets',
  'rpc_place_sports_bet',
] as const;

export const SPORTS_HUB_SURFACE_OWNERS = [
  'sports-page.tsx',
  'sports-fixture-board.tsx',
  'sports-fixture-markets-panel.tsx',
  'sports-my-bets-panel.tsx',
  'sports-bet-slip-panel.tsx',
] as const;

export const SPORTS_HUB_ROUTE_OWNERS = [
  'sports.prematch.tsx',
  'sports.my-bets.tsx',
  'sports.fixture.$fixtureId.tsx',
] as const;

/** Legacy operator alias — exact redirect to canonical my-bets. */
export const SPORTS_MY_BETS_LEGACY_ALIAS = '/my-bets' as const;

export const SPORTS_FIXTURE_MARKETS_HOOK = 'useGetFixtureMarkets' as const;

/** Sports#0 shows match_1x2 only; other market types unlock in Sports#1. */
export const SPORTS_HUB_FIXTURE_PRIMARY_MARKET = 'match_1x2' as const;

export const SPORTS_HUB_FIXTURE_SEO_TITLE_KEY = 'seo.sports.title' as const satisfies MessageKey;

export function isSportsHubBoardMode(mode: SportsPageMode): boolean {
  return mode === 'home' || mode === 'prematch' || mode === 'live' || mode === 'fixture';
}

export function isSportsHubSlipMode(mode: SportsPageMode): boolean {
  return isSportsHubBoardMode(mode);
}

export function assertSportsHubPagesDisplayContractSync(): void {
  if (P10_SPORTS_HUB_PAGES_TODO !== 'p10-sports-hub-pages') {
    throw new Error('sports-hub-pages: owner todo id drift');
  }
  if (!P10_SPORTS_HUB_PAGES_PREREQUISITE_TODOS.includes('p10-sports-fiat-hint-wire')) {
    throw new Error('sports-hub-pages: fiat-hint prerequisite missing');
  }
  if (!SPORTS_PRIMARY_ROUTE.startsWith('/sports')) {
    throw new Error('sports-hub-pages: primary route must stay under /sports');
  }
  if (SPORTS_FIXTURE_ROUTE_PREFIX !== '/sports/fixture/') {
    throw new Error('sports-hub-pages: fixture route prefix drift');
  }
  if (P10_SPORTS_HUB_REGISTERED_ROUTES.length !== 5) {
    throw new Error('sports-hub-pages: expected 5 hub subnav routes');
  }
  if (SPORTS_HUB_FIXTURE_PRIMARY_MARKET !== 'match_1x2') {
    throw new Error('sports-hub-pages: Sports#0 primary market must be match_1x2');
  }
}
