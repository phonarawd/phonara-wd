/**
 * P11 Earn side surfaces bundle — owner contract for gate:ai-impl (#219).
 * Routes: `/events` · `/earn/play` · `/earn/cashback` · `/referral/leaderboard` STUB.
 */

export const P11_EARN_SIDE_SURFACES_TODO = 'p11-earn-side-surfaces' as const;

export const P11_EARN_SIDE_SURFACES_ROUTES = [
  '/events',
  '/earn/play',
  '/earn/cashback',
  '/referral/leaderboard',
] as const;

export const P11_EARN_SIDE_SURFACES_TEST_PATHS = [
  'apps/web/src/domain/__tests__/events-hub-display-contract.test.ts',
  'apps/web/src/domain/__tests__/earn-play-display-contract.test.ts',
  'apps/web/src/domain/__tests__/earn-cashback-display-contract.test.ts',
  'apps/web/src/domain/__tests__/referral-leaderboard-display-contract.test.ts',
  'apps/web/src/product/surfaces/events/__tests__/events-hub-page.test.tsx',
  'apps/web/src/product/surfaces/earn/__tests__/earn-play-page.test.tsx',
  'apps/web/src/product/surfaces/earn/__tests__/earn-cashback-page.test.tsx',
  'apps/web/src/product/surfaces/referral/__tests__/referral-leaderboard-page.test.tsx',
  'apps/web/src/product/shell/__tests__/subnav-route-manifest.test.ts',
] as const;

export function assertP11EarnSideSurfacesSync(): void {
  if (P11_EARN_SIDE_SURFACES_ROUTES.length !== 4) {
    throw new Error('P11 side surfaces must cover exactly 4 routes');
  }
  if (!P11_EARN_SIDE_SURFACES_ROUTES.includes('/events')) {
    throw new Error('P11 must include /events');
  }
  if (!P11_EARN_SIDE_SURFACES_ROUTES.includes('/referral/leaderboard')) {
    throw new Error('P11 must include /referral/leaderboard STUB');
  }
}
