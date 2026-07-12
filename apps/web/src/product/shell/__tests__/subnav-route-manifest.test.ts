import { describe, expect, it } from 'vitest';

import { EARN_SUBNAV, EARN_SUBNAV_CORE } from '../earn-subnav';
import { CASINO_SUBNAV } from '../casino-subnav';
import { TRADE_SUBNAV } from '../trade-subnav';
import {
  filterRegisteredSubnavItems,
  P7_EARN_STAKING_ROUTES,
  P7_GROWTH_REGISTERED_ROUTES,
  P8_CORE_REGISTERED_ROUTES,
  P9_TRADE_REGISTERED_ROUTES,
  P11_SIDE_INCOME_REGISTERED_ROUTES,
  SHELL_SUBNAV_REGISTERED_ROUTES,
} from '../subnav-route-manifest';
import { SPORTS_SUBNAV } from '../sports-subnav';

describe('subnav-route-manifest §12.19.6', () => {
  it('earn core has 9 items pre-P9 (staking separate)', () => {
    expect(EARN_SUBNAV_CORE).toHaveLength(9);
    expect(EARN_SUBNAV).toHaveLength(10);
  });

  it('filters subnav to registered routes only', () => {
    const visible = filterRegisteredSubnavItems(EARN_SUBNAV);
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
    expect(SHELL_SUBNAV_REGISTERED_ROUTES.has('/home/missions')).toBe(true);
    expect(SHELL_SUBNAV_REGISTERED_ROUTES.has('/home/attendance')).toBe(true);
    expect(SHELL_SUBNAV_REGISTERED_ROUTES.has('/referral/invite')).toBe(true);
    expect(SHELL_SUBNAV_REGISTERED_ROUTES.has('/tier/me')).toBe(true);
    expect(SHELL_SUBNAV_REGISTERED_ROUTES.has('/tier/benefits')).toBe(true);
    expect(SHELL_SUBNAV_REGISTERED_ROUTES.has('/share/earnings')).toBe(true);
  });

  it('includes P11 side-income routes in manifest (p11-earn-side-surfaces)', () => {
    for (const route of P11_SIDE_INCOME_REGISTERED_ROUTES) {
      expect(SHELL_SUBNAV_REGISTERED_ROUTES.has(route)).toBe(true);
    }
    expect(SHELL_SUBNAV_REGISTERED_ROUTES.has('/events')).toBe(true);
    expect(SHELL_SUBNAV_REGISTERED_ROUTES.has('/earn/play')).toBe(true);
    expect(SHELL_SUBNAV_REGISTERED_ROUTES.has('/earn/cashback')).toBe(true);
    expect(SHELL_SUBNAV_REGISTERED_ROUTES.has('/referral/leaderboard')).toBe(true);
  });

  it('includes wallet redeem in manifest (p11-page-wallet-redeem)', () => {
    expect(SHELL_SUBNAV_REGISTERED_ROUTES.has('/wallet/redeem')).toBe(true);
  });

  it('includes P7 curated mission routes in manifest (p7-gate-growth)', () => {
    for (const route of P7_GROWTH_REGISTERED_ROUTES) {
      expect(SHELL_SUBNAV_REGISTERED_ROUTES.has(route)).toBe(true);
    }
    expect(SHELL_SUBNAV_REGISTERED_ROUTES.has('/home/missions/invite')).toBe(true);
    expect(SHELL_SUBNAV_REGISTERED_ROUTES.has('/home/missions/referral')).toBe(true);
  });

  it('includes P8 core routes in manifest (p8-gate-core)', () => {
    for (const route of P8_CORE_REGISTERED_ROUTES) {
      expect(SHELL_SUBNAV_REGISTERED_ROUTES.has(route)).toBe(true);
    }
    expect(SHELL_SUBNAV_REGISTERED_ROUTES.has('/notifications')).toBe(true);
    expect(SHELL_SUBNAV_REGISTERED_ROUTES.has('/settings/notifications')).toBe(true);
    expect(SHELL_SUBNAV_REGISTERED_ROUTES.has('/account/profile')).toBe(true);
  });

  it('includes trade futures route in manifest (p9-page-trade-futures)', () => {
    expect(SHELL_SUBNAV_REGISTERED_ROUTES.has('/trade/futures')).toBe(true);
  });

  it('includes trade positions route in manifest (p9-page-trade-positions)', () => {
    expect(SHELL_SUBNAV_REGISTERED_ROUTES.has('/trade/positions')).toBe(true);
  });

  it('includes trade orders route in manifest (p9-page-trade-orders)', () => {
    expect(SHELL_SUBNAV_REGISTERED_ROUTES.has('/trade/orders')).toBe(true);
  });

  it('includes all P7 earn staking routes in manifest (earn subnav only)', () => {
    for (const route of P7_EARN_STAKING_ROUTES) {
      expect(SHELL_SUBNAV_REGISTERED_ROUTES.has(route)).toBe(true);
    }
    expect(P7_EARN_STAKING_ROUTES).toEqual(['/staking', '/staking/positions']);
    for (const route of P9_TRADE_REGISTERED_ROUTES) {
      expect(route.startsWith('/staking')).toBe(false);
    }
  });

  it('includes all P9 trade routes in manifest (p9-gate-trade)', () => {
    expect(P9_TRADE_REGISTERED_ROUTES).toHaveLength(3);
    for (const route of P9_TRADE_REGISTERED_ROUTES) {
      expect(SHELL_SUBNAV_REGISTERED_ROUTES.has(route)).toBe(true);
    }
    const visible = filterRegisteredSubnavItems(TRADE_SUBNAV);
    for (const item of visible) {
      expect(SHELL_SUBNAV_REGISTERED_ROUTES.has(item.to)).toBe(true);
    }
    expect(visible.map((item) => item.to)).not.toContain('/staking');
  });

  it('shows sports hub child routes after P10 Sports#0 manifest', () => {
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

  it('shows casino fairness after p10-page-casino-fairness manifest', () => {
    expect(SHELL_SUBNAV_REGISTERED_ROUTES.has('/casino/fairness')).toBe(true);
    expect(SHELL_SUBNAV_REGISTERED_ROUTES.has('/casino/tournaments')).toBe(false);
    expect(CASINO_SUBNAV.map((item) => item.to)).not.toContain('/casino/tournaments');
  });
});
