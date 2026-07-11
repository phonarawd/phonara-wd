import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import type { FileRoutesByFullPath } from '../../routeTree.gen';
import { EARN_SUBNAV } from '../../product/shell/earn-subnav';
import { WALLET_SUBNAV } from '../../product/shell/wallet-subnav';
import {
  filterRegisteredSubnavItems,
  P11_SIDE_INCOME_REGISTERED_ROUTES,
  P11_WALLET_REDEEM_REGISTERED_ROUTES,
  SHELL_SUBNAV_REGISTERED_ROUTES,
} from '../../product/shell/subnav-route-manifest';
import { P11_EARN_SIDE_SURFACES_TODO } from '../earn-side-surfaces-display-contract';
import {
  assertP11GateSideIncomeSync,
  P11_GATE_SIDE_INCOME_ARTIFACT_PATHS,
  P11_GATE_SIDE_INCOME_MANIFEST_ROUTES,
  P11_GATE_SIDE_INCOME_PREREQUISITE_TODOS,
  P11_GATE_SIDE_INCOME_STUB_ROUTES,
  P11_GATE_SIDE_INCOME_TEST_PATHS,
  P11_GATE_SIDE_INCOME_TODO,
  P12_TRUST_MARKETING_HUB_TODO,
} from '../p11-gate-side-income-display-contract';
import { P11_PAGE_WALLET_REDEEM_TODO } from '../wallet-redeem-display-contract';
import { shouldDeferReferralLeaderboard } from '../referral-leaderboard-display-contract';

const WEB_SRC = resolve(import.meta.dirname, '../..');
const REPO_ROOT = resolve(WEB_SRC, '../../..');

/** TanStack Router full paths — compile-time route existence check. */
type RegisteredFullPath = keyof FileRoutesByFullPath;

function assertRegisteredFullPath(path: RegisteredFullPath): RegisteredFullPath {
  return path;
}

describe('p11-gate-side-income-display-contract §12.19.6 · YAML #221', () => {
  it('registers GATE todo · prerequisites · next P12', () => {
    expect(P11_GATE_SIDE_INCOME_TODO).toBe('p11-gate-side-income');
    expect(P11_GATE_SIDE_INCOME_PREREQUISITE_TODOS).toEqual([
      P11_EARN_SIDE_SURFACES_TODO,
      P11_PAGE_WALLET_REDEEM_TODO,
    ]);
    expect(P12_TRUST_MARKETING_HUB_TODO).toBe('p12-trust-marketing-hub');
    expect(() => assertP11GateSideIncomeSync()).not.toThrow();
  });

  it('locks §12.19.6 GATE manifest routes · TanStack fullPath dead link 0', () => {
    expect([...P11_GATE_SIDE_INCOME_MANIFEST_ROUTES]).toEqual([
      '/wallet/redeem',
      '/earn/cashback',
      '/earn/play',
      '/events',
    ]);

    for (const route of P11_GATE_SIDE_INCOME_MANIFEST_ROUTES) {
      expect(SHELL_SUBNAV_REGISTERED_ROUTES.has(route)).toBe(true);
      expect(assertRegisteredFullPath(route as RegisteredFullPath)).toBe(route);
    }

    expect([...P11_WALLET_REDEEM_REGISTERED_ROUTES]).toEqual(['/wallet/redeem']);
    expect(P11_SIDE_INCOME_REGISTERED_ROUTES).toContain('/events');
    expect(P11_SIDE_INCOME_REGISTERED_ROUTES).toContain('/earn/play');
    expect(P11_SIDE_INCOME_REGISTERED_ROUTES).toContain('/earn/cashback');
  });

  it('keeps earn + wallet subnav chips registered only (no 404)', () => {
    const earnVisible = filterRegisteredSubnavItems(EARN_SUBNAV);
    for (const item of earnVisible) {
      expect(SHELL_SUBNAV_REGISTERED_ROUTES.has(item.to)).toBe(true);
    }
    expect(earnVisible.map((item) => item.to)).toContain('/earn/cashback');
    expect(earnVisible.map((item) => item.to)).toContain('/earn/play');
    expect(earnVisible.map((item) => item.to)).not.toContain('/referral/leaderboard');
    expect(earnVisible.map((item) => item.to)).not.toContain('/events');

    const walletVisible = filterRegisteredSubnavItems(WALLET_SUBNAV);
    for (const item of walletVisible) {
      expect(SHELL_SUBNAV_REGISTERED_ROUTES.has(item.to)).toBe(true);
    }
    expect(walletVisible.map((item) => item.to)).toContain('/wallet/redeem');
  });

  it('keeps referral leaderboard as companion route (GATE-unlocked · E5 wire pending)', () => {
    expect([...P11_GATE_SIDE_INCOME_STUB_ROUTES]).toEqual(['/referral/leaderboard']);
    expect(SHELL_SUBNAV_REGISTERED_ROUTES.has('/referral/leaderboard')).toBe(true);
    expect(assertRegisteredFullPath('/referral/leaderboard')).toBe('/referral/leaderboard');
    expect(shouldDeferReferralLeaderboard()).toBe(false);
  });

  it('requires GATE artifacts and owner test paths on disk', () => {
    for (const rel of P11_GATE_SIDE_INCOME_ARTIFACT_PATHS) {
      expect(existsSync(resolve(WEB_SRC, rel))).toBe(true);
    }
    for (const rel of P11_GATE_SIDE_INCOME_TEST_PATHS) {
      expect(existsSync(resolve(REPO_ROOT, rel))).toBe(true);
    }
  });
});
