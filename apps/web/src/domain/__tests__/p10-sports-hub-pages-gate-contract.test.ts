import { describe, expect, it } from 'vitest';

import type { FileRoutesByFullPath } from '../../routeTree.gen';
import {
  P10_SPORTS_HUB_PAGES_TODO,
  P10_SPORTS_HUB_REGISTERED_ROUTES as CONTRACT_HUB_ROUTES,
  SPORTS_MY_BETS_ROUTE,
  SPORTS_PREMATCH_ROUTE,
  sportsFixtureDetailPath,
} from '../sports-hub-pages-display-contract';
import { SPORTS_SUBNAV } from '../../product/shell/sports-subnav';
import {
  filterRegisteredSubnavItems,
  P10_SPORTS_HUB_REGISTERED_ROUTES,
  SHELL_SUBNAV_REGISTERED_ROUTES,
} from '../../product/shell/subnav-route-manifest';

/** TanStack Router full paths — compile-time route existence check. */
type RegisteredFullPath = keyof FileRoutesByFullPath;

function assertRegisteredFullPath(path: RegisteredFullPath): RegisteredFullPath {
  return path;
}

describe('p10-sports-hub-pages §12.19.6 · Sports#0', () => {
  it('locks Sports#0 owner todo and manifest parity', () => {
    expect(P10_SPORTS_HUB_PAGES_TODO).toBe('p10-sports-hub-pages');
    expect([...P10_SPORTS_HUB_REGISTERED_ROUTES]).toEqual([...CONTRACT_HUB_ROUTES]);
  });

  it('registers hub child routes in subnav manifest', () => {
    for (const route of P10_SPORTS_HUB_REGISTERED_ROUTES) {
      expect(SHELL_SUBNAV_REGISTERED_ROUTES.has(route)).toBe(true);
    }
    expect(P10_SPORTS_HUB_REGISTERED_ROUTES).toHaveLength(5);
  });

  it('maps hub + fixture routes to TanStack fullPath (dead link 0)', () => {
    expect(assertRegisteredFullPath(SPORTS_PREMATCH_ROUTE as RegisteredFullPath)).toBe(
      '/sports/prematch',
    );
    expect(assertRegisteredFullPath(SPORTS_MY_BETS_ROUTE as RegisteredFullPath)).toBe(
      '/sports/my-bets',
    );
    expect(assertRegisteredFullPath('/sports/fixture/$fixtureId' as RegisteredFullPath)).toBe(
      '/sports/fixture/$fixtureId',
    );
    expect(sportsFixtureDetailPath('fx-1')).toBe('/sports/fixture/fx-1');
  });

  it('filters sportsSubnav to registered hub routes only', () => {
    const visible = filterRegisteredSubnavItems(SPORTS_SUBNAV);
    expect(visible.map((item) => item.to)).toEqual([
      '/sports',
      '/sports/prematch',
      '/sports/live',
      '/sports/my-bets',
      '/sports/rules',
      '/sports/vip',
    ]);
  });
});
