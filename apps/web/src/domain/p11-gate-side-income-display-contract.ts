/**
 * P11 Side-income Part GATE (§12.19.6 · §12.5 · YAML #221).
 * Authority: `p11-gate-side-income` · REBUILD_PLAN_v1 · ACTIVE_WORK_SSOT.
 *
 * Bundle closeout for Earn side surfaces + wallet redeem.
 * GATE does not re-implement surfaces — asserts manifest · routes · artifacts.
 */

import {
  assertP11EarnSideSurfacesSync,
  P11_EARN_SIDE_SURFACES_ROUTES,
  P11_EARN_SIDE_SURFACES_TODO,
} from './earn-side-surfaces-display-contract';
import { EARN_CASHBACK_ROUTE } from './earn-cashback-display-contract';
import { EARN_PLAY_ROUTE, EARN_PLAY_FORBIDDEN_CASINO_ROUTE } from './earn-play-display-contract';
import { EVENTS_HUB_ROUTE } from './events-hub-display-contract';
import {
  REFERRAL_LEADERBOARD_ROUTE,
  shouldDeferReferralLeaderboard,
} from './referral-leaderboard-display-contract';
import {
  assertWalletRedeemRailsSync,
  P11_PAGE_WALLET_REDEEM_TODO,
  WALLET_REDEEM_ROUTE,
} from './wallet-redeem-display-contract';

export const P11_GATE_SIDE_INCOME_TODO = 'p11-gate-side-income' as const;

/** Immediate prerequisites — Earn side + wallet redeem must be closed before GATE. */
export const P11_GATE_SIDE_INCOME_PREREQUISITE_TODOS = [
  P11_EARN_SIDE_SURFACES_TODO,
  P11_PAGE_WALLET_REDEEM_TODO,
] as const;

/** Next Track A todo after this GATE (§20.6 · P12). */
export const P12_TRUST_MARKETING_HUB_TODO = 'p12-trust-marketing-hub' as const;

/**
 * §12.19.6 P11 Part GATE manifest routes — dead link 0.
 * `/referral/leaderboard` is STUB companion (earn-side) — not a GATE chip requirement.
 */
export const P11_GATE_SIDE_INCOME_MANIFEST_ROUTES = [
  WALLET_REDEEM_ROUTE,
  EARN_CASHBACK_ROUTE,
  EARN_PLAY_ROUTE,
  EVENTS_HUB_ROUTE,
] as const;

/** STUB companion from `p11-earn-side-surfaces` — route exists · subnav chip hidden. */
export const P11_GATE_SIDE_INCOME_STUB_ROUTES = [REFERRAL_LEADERBOARD_ROUTE] as const;

/** On-disk artifacts required for P11 GATE. */
export const P11_GATE_SIDE_INCOME_ARTIFACT_PATHS = [
  'domain/p11-gate-side-income-display-contract.ts',
  'domain/earn-side-surfaces-display-contract.ts',
  'domain/events-hub-display-contract.ts',
  'domain/earn-play-display-contract.ts',
  'domain/earn-cashback-display-contract.ts',
  'domain/referral-leaderboard-display-contract.ts',
  'domain/wallet-redeem-display-contract.ts',
  'product/shell/subnav-route-manifest.ts',
  'product/surfaces/events/events-hub-page.tsx',
  'product/surfaces/earn/earn-play-page.tsx',
  'product/surfaces/earn/earn-cashback-page.tsx',
  'product/surfaces/referral/referral-leaderboard-page.tsx',
  'product/surfaces/wallet/wallet-redeem-page.tsx',
  'routes/events.tsx',
  'routes/earn.play.tsx',
  'routes/earn.cashback.tsx',
  'routes/referral.leaderboard.tsx',
  'routes/wallet.redeem.tsx',
] as const;

/** gate:ai-impl owner paths. */
export const P11_GATE_SIDE_INCOME_TEST_PATHS = [
  'apps/web/src/domain/__tests__/p11-gate-side-income-display-contract.test.ts',
  'apps/web/src/domain/__tests__/earn-side-surfaces-display-contract.test.ts',
  'apps/web/src/domain/__tests__/events-hub-display-contract.test.ts',
  'apps/web/src/domain/__tests__/earn-play-display-contract.test.ts',
  'apps/web/src/domain/__tests__/earn-cashback-display-contract.test.ts',
  'apps/web/src/domain/__tests__/referral-leaderboard-display-contract.test.ts',
  'apps/web/src/domain/__tests__/wallet-redeem-display-contract.test.ts',
  'apps/web/src/product/shell/__tests__/subnav-route-manifest.test.ts',
  'apps/web/src/product/surfaces/events/__tests__/events-hub-page.test.tsx',
  'apps/web/src/product/surfaces/earn/__tests__/earn-play-page.test.tsx',
  'apps/web/src/product/surfaces/earn/__tests__/earn-cashback-page.test.tsx',
  'apps/web/src/product/surfaces/referral/__tests__/referral-leaderboard-page.test.tsx',
  'apps/web/src/product/surfaces/wallet/__tests__/wallet-redeem-page.test.tsx',
] as const;

/** Non-waivable sync for P11 Side-income GATE closeout. */
export function assertP11GateSideIncomeSync(): void {
  if (P11_GATE_SIDE_INCOME_TODO !== 'p11-gate-side-income') {
    throw new Error('p11-gate-side-income: todo id drift');
  }

  if (!P11_GATE_SIDE_INCOME_PREREQUISITE_TODOS.includes(P11_EARN_SIDE_SURFACES_TODO)) {
    throw new Error('p11-gate-side-income: missing prerequisite p11-earn-side-surfaces');
  }

  if (!P11_GATE_SIDE_INCOME_PREREQUISITE_TODOS.includes(P11_PAGE_WALLET_REDEEM_TODO)) {
    throw new Error('p11-gate-side-income: missing prerequisite p11-page-wallet-redeem');
  }

  if (P12_TRUST_MARKETING_HUB_TODO !== 'p12-trust-marketing-hub') {
    throw new Error('p11-gate-side-income: next P12 todo drift');
  }

  if (P11_GATE_SIDE_INCOME_MANIFEST_ROUTES.length !== 4) {
    throw new Error('p11-gate-side-income: §12.19.6 must list exactly 4 GATE routes');
  }

  const expected = [
    '/wallet/redeem',
    '/earn/cashback',
    '/earn/play',
    '/events',
  ] as const;
  for (const route of expected) {
    if (!(P11_GATE_SIDE_INCOME_MANIFEST_ROUTES as readonly string[]).includes(route)) {
      throw new Error(`p11-gate-side-income: missing GATE manifest route ${route}`);
    }
  }

  if (WALLET_REDEEM_ROUTE !== '/wallet/redeem') {
    throw new Error('p11-gate-side-income: wallet redeem route drift');
  }

  if (EARN_CASHBACK_ROUTE !== '/earn/cashback') {
    throw new Error('p11-gate-side-income: cashback route drift');
  }

  if (EARN_PLAY_ROUTE !== '/earn/play') {
    throw new Error('p11-gate-side-income: play route drift');
  }

  if (EVENTS_HUB_ROUTE !== '/events') {
    throw new Error('p11-gate-side-income: events route drift');
  }

  if (EARN_PLAY_FORBIDDEN_CASINO_ROUTE !== '/games/roulette') {
    throw new Error('p11-gate-side-income: earn play must never link casino roulette');
  }

  if (REFERRAL_LEADERBOARD_ROUTE !== '/referral/leaderboard') {
    throw new Error('p11-gate-side-income: leaderboard STUB route drift');
  }

  // E3 GATE unlocks engine path — defer stub lifts. Rank list live wire = E5.
  if (shouldDeferReferralLeaderboard()) {
    throw new Error(
      'p11-gate-side-income: leaderboard must be GATE-unlocked (referralLeaderboardLive)',
    );
  }

  if (!P11_EARN_SIDE_SURFACES_ROUTES.includes('/referral/leaderboard')) {
    throw new Error('p11-gate-side-income: earn-side must still own leaderboard STUB');
  }

  assertP11EarnSideSurfacesSync();
  assertWalletRedeemRailsSync();

  if (P11_GATE_SIDE_INCOME_TEST_PATHS.length < 8) {
    throw new Error('p11-gate-side-income: owner test paths incomplete');
  }

  if (P11_GATE_SIDE_INCOME_ARTIFACT_PATHS.length < 10) {
    throw new Error('p11-gate-side-income: artifact paths incomplete');
  }
}
