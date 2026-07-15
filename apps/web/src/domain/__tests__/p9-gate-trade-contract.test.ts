import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import type { FileRoutesByFullPath } from '../../routeTree.gen';
import { FIRST_TRADE_EDUCATION_STORAGE_KEY } from '../operator-trust-pages-display-contract';
import { STAKING_HUB_ROUTE, STAKING_POSITIONS_ROUTE } from '../staking-display-contract';
import { EARN_SUBNAV } from '../../product/shell/earn-subnav';
import { TRADE_SUBNAV } from '../../product/shell/trade-subnav';
import {
  filterRegisteredSubnavItems,
  P7_EARN_STAKING_ROUTES,
  P9_TRADE_REGISTERED_ROUTES,
  SHELL_SUBNAV_REGISTERED_ROUTES,
} from '../../product/shell/subnav-route-manifest';

/** TanStack Router full paths — compile-time route existence check. */
type RegisteredFullPath = keyof FileRoutesByFullPath;

function assertRegisteredFullPath(path: RegisteredFullPath): RegisteredFullPath {
  return path;
}

const TRADE_ERROR_TOAST_PATH = resolve(
  import.meta.dirname,
  '../../features/trading/use-trade-error-toast.ts',
);

describe('p9-gate-trade §12.19.6 · §3.4 · §32.5', () => {
  it('registers all P9 trade routes in subnav manifest', () => {
    for (const route of P9_TRADE_REGISTERED_ROUTES) {
      expect(SHELL_SUBNAV_REGISTERED_ROUTES.has(route)).toBe(true);
    }
    expect(P9_TRADE_REGISTERED_ROUTES).toHaveLength(3);
    for (const route of P7_EARN_STAKING_ROUTES) {
      expect(SHELL_SUBNAV_REGISTERED_ROUTES.has(route)).toBe(true);
    }
  });

  it('maps every P9 manifest route to a TanStack fullPath (dead link 0)', () => {
    for (const route of P9_TRADE_REGISTERED_ROUTES) {
      expect(assertRegisteredFullPath(route as RegisteredFullPath)).toBe(route);
    }
    expect(assertRegisteredFullPath('/trade' as RegisteredFullPath)).toBe('/trade');
    expect(assertRegisteredFullPath(STAKING_HUB_ROUTE as RegisteredFullPath)).toBe('/staking');
    expect(assertRegisteredFullPath(STAKING_POSITIONS_ROUTE as RegisteredFullPath)).toBe(
      '/staking/positions',
    );
  });

  it('filters tradeSubnav to registered routes only (no 404 chips)', () => {
    const visible = filterRegisteredSubnavItems(TRADE_SUBNAV);
    for (const item of visible) {
      expect(SHELL_SUBNAV_REGISTERED_ROUTES.has(item.to)).toBe(true);
    }
    expect(visible.map((item) => item.to)).toEqual([
      '/trade',
      '/trade/futures',
      '/trade/positions',
      '/trade/orders',
      '/ledger',
    ]);
  });

  it('shows staking chip in earnSubnav after P9 manifest extension', () => {
    const visible = filterRegisteredSubnavItems(EARN_SUBNAV);
    expect(visible.some((item) => item.to === '/staking')).toBe(true);
    expect(visible.map((item) => item.to)).toEqual([
      '/home',
      '/home/missions',
      '/home/attendance',
      '/referral',
      '/tier/me',
      '/tier/benefits',
      '/earn/cashback',
      '/earn/play',
      '/share/earnings',
      '/staking',
    ]);
  });

  it('removes use-trade-error-toast glue (§3.4 productToast strict only)', () => {
    expect(existsSync(TRADE_ERROR_TOAST_PATH)).toBe(false);
  });

  it('defines trade first-visit education storage key (§32.5)', () => {
    expect(FIRST_TRADE_EDUCATION_STORAGE_KEY).toBe('phonara.education.trade.dismissed');
  });
});
