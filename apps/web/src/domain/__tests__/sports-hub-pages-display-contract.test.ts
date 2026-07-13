import { describe, expect, it } from 'vitest';

import {
  assertSportsHubPagesDisplayContractSync,
  isSportsHubBoardMode,
  isSportsHubSlipMode,
  P10_SPORTS_HUB_PAGES_PREREQUISITE_TODOS,
  P10_SPORTS_HUB_PAGES_TODO,
  P10_SPORTS_HUB_REGISTERED_ROUTES,
  SPORTS_FIXTURE_MARKETS_HOOK,
  SPORTS_HUB_ENGINE_RPCS,
  SPORTS_HUB_FIXTURE_PRIMARY_MARKET,
  SPORTS_HUB_ROUTE_OWNERS,
  SPORTS_MY_BETS_LEGACY_ALIAS,
  SPORTS_MY_BETS_ROUTE,
  SPORTS_PREMATCH_ROUTE,
  sportsFixtureDetailPath,
} from '../sports-hub-pages-display-contract';
import { SPORTS_FIXTURE_ROUTE_PREFIX } from '../sports-cashout-combo-display-contract';

describe('sports-hub-pages-display-contract Sports#0', () => {
  it('locks owner todo, prerequisites, and hub routes', () => {
    expect(P10_SPORTS_HUB_PAGES_TODO).toBe('p10-sports-hub-pages');
    expect(P10_SPORTS_HUB_PAGES_PREREQUISITE_TODOS).toContain('p10-sports-fiat-hint-wire');
    expect(P10_SPORTS_HUB_PAGES_PREREQUISITE_TODOS).toContain('p10-page-sports');
    expect(P10_SPORTS_HUB_REGISTERED_ROUTES).toEqual([
      '/sports/prematch',
      '/sports/live',
      '/sports/my-bets',
      '/sports/rules',
      '/sports/vip',
    ]);
    expect(SPORTS_PREMATCH_ROUTE).toBe('/sports/prematch');
    expect(SPORTS_MY_BETS_ROUTE).toBe('/sports/my-bets');
    expect(SPORTS_MY_BETS_LEGACY_ALIAS).toBe('/my-bets');
  });

  it('builds fixture detail paths under canonical prefix', () => {
    expect(sportsFixtureDetailPath('fx-1')).toBe(`${SPORTS_FIXTURE_ROUTE_PREFIX}fx-1`);
    expect(SPORTS_HUB_ROUTE_OWNERS).toContain('sports.fixture.$fixtureId.tsx');
    expect(SPORTS_FIXTURE_MARKETS_HOOK).toBe('useGetFixtureMarkets');
    expect(SPORTS_HUB_FIXTURE_PRIMARY_MARKET).toBe('match_1x2');
    expect(SPORTS_HUB_ENGINE_RPCS).toContain('rpc_get_fixture_markets');
  });

  it('treats fixture mode as board+slip surface', () => {
    expect(isSportsHubBoardMode('fixture')).toBe(true);
    expect(isSportsHubSlipMode('fixture')).toBe(true);
    expect(isSportsHubBoardMode('my-bets')).toBe(false);
    expect(isSportsHubSlipMode('rules')).toBe(false);
  });

  it('assertSportsHubPagesDisplayContractSync passes', () => {
    expect(() => assertSportsHubPagesDisplayContractSync()).not.toThrow();
  });
});
