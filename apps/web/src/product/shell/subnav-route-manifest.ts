import { normalizeShellPath } from './shell-route-matchers';
import type { SubnavItem } from './earn-subnav';

/** P7 Earn staking routes — Earn subnav only (§12.19.6 · Phase 3 IA). */
export const P7_EARN_STAKING_ROUTES = ['/staking', '/staking/positions'] as const;

/** P7 Growth routes — Part GATE `p7-gate-growth` (§12.19.6). */
export const P7_GROWTH_REGISTERED_ROUTES = [
  '/referral',
  '/referral/invite',
  '/home/missions',
  '/home/attendance',
  '/home/missions/invite',
  '/home/missions/referral',
  '/tier/me',
  '/tier/benefits',
  '/share/earnings',
] as const;

/** P9 Trade routes — Part GATE `p9-gate-trade` (§12.19.6). */
export const P9_TRADE_REGISTERED_ROUTES = [
  '/trade/futures',
  '/trade/positions',
  '/trade/orders',
] as const;

/** P8 Core routes — Part GATE `p8-gate-core` (§12.19.6). */
export const P8_CORE_REGISTERED_ROUTES = [
  '/notifications',
  '/settings',
  '/settings/security',
  '/settings/bank-accounts',
  '/settings/account',
  '/settings/referral',
  '/settings/preferences',
  '/settings/notifications',
  '/settings/api-keys',
  '/account',
  '/account/profile',
] as const;

/**
 * P10 Sports hub child routes — Sports#0 `p10-sports-hub-pages` (§12.19.6).
 * Fixture detail `/sports/fixture/$fixtureId` is deep-link only (not a subnav chip).
 */
export const P10_SPORTS_HUB_REGISTERED_ROUTES = [
  '/sports/prematch',
  '/sports/live',
  '/sports/my-bets',
  '/sports/rules',
  '/sports/vip',
] as const;

/** P10 Casino fairness — `p10-page-casino-fairness` (§12.19.6 · YAML #212). */
export const P10_CASINO_FAIRNESS_REGISTERED_ROUTES = ['/casino/fairness'] as const;

/**
 * P11 Earn side-income routes — `p11-earn-side-surfaces` (§12.19.6 · YAML #219).
 */
export const P11_SIDE_INCOME_REGISTERED_ROUTES = [
  '/events',
  '/earn/play',
  '/earn/cashback',
  '/referral/leaderboard',
] as const;

/** P11 wallet redeem — `p11-page-wallet-redeem` (§12.19.6 · YAML #220). */
export const P11_WALLET_REDEEM_REGISTERED_ROUTES = ['/wallet/redeem'] as const;

/**
 * §12.19.6 — Routes that may appear in domain subnav chips.
 * Extend only in the Part GATE todo that registers the matching TanStack route.
 * Unlisted targets stay hidden (dead link 0 · Strict Perfect).
 */
export const SHELL_SUBNAV_REGISTERED_ROUTES: ReadonlySet<string> = new Set([
  '/home',
  '/wallet',
  '/wallet/deposit',
  '/wallet/withdraw',
  '/ledger',
  '/trade',
  ...P7_EARN_STAKING_ROUTES,
  ...P9_TRADE_REGISTERED_ROUTES,
  '/sports',
  ...P10_SPORTS_HUB_REGISTERED_ROUTES,
  '/casino',
  ...P10_CASINO_FAIRNESS_REGISTERED_ROUTES,
  '/install',
  '/onboarding',
  '/onboarding/missions',
  ...P7_GROWTH_REGISTERED_ROUTES,
  ...P8_CORE_REGISTERED_ROUTES,
  ...P11_SIDE_INCOME_REGISTERED_ROUTES,
  ...P11_WALLET_REDEEM_REGISTERED_ROUTES,
]);

/** Filter subnav items to registered routes only (§12.19.6). */
export function filterRegisteredSubnavItems(items: readonly SubnavItem[]): readonly SubnavItem[] {
  return items.filter((item) => SHELL_SUBNAV_REGISTERED_ROUTES.has(normalizeShellPath(item.to)));
}
