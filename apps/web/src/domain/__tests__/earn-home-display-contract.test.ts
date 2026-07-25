import { describe, expect, it } from 'vitest';

import { EARN_SUBNAV } from '@/product/shell/earn-subnav';

import { filterRegisteredSubnavItems } from '@/product/shell/subnav-route-manifest';

import {
  EARN_ACTIVITY_FEED_RPC,
  EARN_HOME_BOTTOM_NAV,
  EARN_HOME_CANONICAL_ROUTE,
  EARN_HOME_ENGINE_BRANCHES,
  EARN_HOME_ENTRY_CARDS,
  EARN_HOME_HUB_MISSION_PREVIEW_IDS,
  EARN_HOME_HUB_MISSION_PREVIEW_MAX,
  EARN_HOME_P6_SUBNAV_MANIFEST_ROUTES,
  EARN_HOME_P7_SUBNAV_MANIFEST_ROUTES,
  EARN_HOME_P8_CONTROLLER_OWNER,
  EARN_HOME_P8_REPLACEMENT_TODO,
  EARN_HOME_P8_SURFACE_OWNER,
  EARN_HOME_PROOF_MODE,
  EARN_HOME_REDIRECT_ALIASES,
  EARN_HOME_UI_WIRE_STATUS,
  formatEarnHomeCatalogRewardsLabel,
  isEarnHomeCanonicalRoute,
  parseEarnHubWalletSnapshot,
  resolveEarnHomeNextAction,
  resolveEarnHomeProofModeFromEnv,
  sumEarnHomeCatalogRewardsPhon,
} from '../earn-home-display-contract';

import { EARN_HUB_STATUS_RPC } from '../unified-tier-display-contract';

describe('earn-home-display-contract §20.13 #103', () => {
  it('locks canonical /home route with ENGINE:exists earn hub read RPCs', () => {
    expect(EARN_HOME_CANONICAL_ROUTE).toBe('/home');

    expect(EARN_HOME_ENGINE_BRANCHES.hub_status_read).toEqual({
      engine: 'exists',

      rpc: EARN_HUB_STATUS_RPC,

      moneyPath: false,
    });

    expect(EARN_HOME_ENGINE_BRANCHES.activity_feed_read).toEqual({
      engine: 'exists',

      rpc: EARN_ACTIVITY_FEED_RPC,

      moneyPath: false,
    });
  });

  it('documents P8 wired surface and same-route replacement', () => {
    expect(EARN_HOME_UI_WIRE_STATUS).toBe('wired');

    expect(EARN_HOME_P8_REPLACEMENT_TODO).toBe('p8-page-home');

    expect(EARN_HOME_P8_SURFACE_OWNER).toBe(
      'apps/web/src/product/surfaces/home/earn-home-page.tsx',
    );

    expect(EARN_HOME_P8_CONTROLLER_OWNER).toBe(
      'apps/web/src/features/earn/use-earn-home-page-controller.ts',
    );

    expect(EARN_HOME_REDIRECT_ALIASES).toContain('/earn');

    expect(EARN_HOME_REDIRECT_ALIASES).toContain('/dashboard');

    expect(EARN_HOME_PROOF_MODE).toBe('hidden');
  });

  it('enforces Tab1 Strict Perfect — nav.earn → /home only', () => {
    expect(EARN_HOME_BOTTOM_NAV).toEqual({ labelKey: 'nav.earn', to: '/home' });

    expect(isEarnHomeCanonicalRoute('/home')).toBe(true);

    expect(isEarnHomeCanonicalRoute('/home/')).toBe(true);

    expect(isEarnHomeCanonicalRoute('/earn')).toBe(false);
  });

  it('aligns §12.19.6 manifest with P7 earnSubnav when growth routes are registered', () => {
    expect(EARN_HOME_P6_SUBNAV_MANIFEST_ROUTES).toEqual(['/home']);

    expect(EARN_HOME_P7_SUBNAV_MANIFEST_ROUTES).toEqual([
      '/home',

      '/home/missions',

      '/home/attendance',

      '/referral',

      '/tier/me',

      '/tier/benefits',

      '/share/earnings',

      '/staking',
    ]);

    const visible = filterRegisteredSubnavItems(EARN_SUBNAV).map((item) => item.to);

    for (const route of EARN_HOME_P7_SUBNAV_MANIFEST_ROUTES) {
      expect(visible).toContain(route);
    }

    // P11 side-income chips register after p11-earn-side-surfaces
    expect(visible).toContain('/earn/cashback');
    expect(visible).toContain('/earn/play');
  });

  it('routes home events entry card to /events hub', () => {
    const eventsCard = EARN_HOME_ENTRY_CARDS.find((card) => card.id === 'events');
    expect(eventsCard?.route).toBe('/events');
  });

  it('exposes L2 catalog sum and hub mission preview ids (§28.7)', () => {
    const sum = sumEarnHomeCatalogRewardsPhon();

    expect(sum).toBeGreaterThan(0);

    expect(formatEarnHomeCatalogRewardsLabel(sum)).toMatch(/^\+[\d,]+P$/);

    expect(EARN_HOME_HUB_MISSION_PREVIEW_IDS.length).toBe(EARN_HOME_HUB_MISSION_PREVIEW_MAX);
    expect(EARN_HOME_HUB_MISSION_PREVIEW_MAX).toBe(3);

    expect(EARN_HOME_ENTRY_CARDS.map((card) => card.id)).toEqual([
      'missions',

      'events',

      'wallet',

      'bet',

      'trade',
    ]);
  });

  it('routes home trade entry card to /trade (ZA-11 — Earn had 0 Trade cross-sell entry points)', () => {
    const tradeCard = EARN_HOME_ENTRY_CARDS.find((card) => card.id === 'trade');
    expect(tradeCard?.route).toBe('/trade');
  });

  it('prioritizes attendance as next action when claimable', () => {
    const next = resolveEarnHomeNextAction({
      attendanceRemaining: 1,

      rouletteRemaining: 2,

      claimableMissionId: 'viral-shareLink',

      claimableMissionTitleKey: 'mission.viral.shareLink',
    });

    expect(next.kind).toBe('attendance');

    expect(next.route).toBe('/home/attendance');
  });

  it('parses hub wallet snapshot with zero-issuance reward tickets', () => {
    const wallet = parseEarnHubWalletSnapshot({
      wallet: {
        phon_balance: '2500.000000',
        discount_tickets: 0,
        free_trade_tickets: 0,
      },
    });

    expect(wallet).toEqual({
      phonBalanceLabel: '+2,500P',
      discountTickets: 0,
      freeTradeTickets: 0,
    });
  });

  it('defaults earn home proof mode to hidden (landing ambientSocial parity)', () => {
    expect(resolveEarnHomeProofModeFromEnv({})).toBe('hidden');
    expect(resolveEarnHomeProofModeFromEnv({ VITE_PHONARA_EARN_HOME_PROOF_MODE: 'ambient' })).toBe(
      'ambient',
    );
    expect(resolveEarnHomeProofModeFromEnv({ VITE_PHONARA_EARN_HOME_PROOF_MODE: 'live' })).toBe(
      'live',
    );
  });
});
