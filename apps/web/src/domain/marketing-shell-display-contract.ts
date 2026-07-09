/**
 * §12.19.5 marketing zone — standalone shell outside AppShell (Phase R P3).
 * Authority: plan §22.2 Landing+Auth · §28.5 attribution routes.
 */

import { ADS_ATTRIBUTION_ROUTES } from '@/domain/ads-attribution-display-contract';

/** Chrome owner for campaign landing + auth funnel — never mounts BottomNav/TopBar. */
export const MARKETING_SHELL_ZONE = 'standalone' as const;

export const MARKETING_SHELL_AUTH_ROUTES = [
  '/login',
  '/signup',
  '/reset-password',
  '/verify-email',
] as const;

export type MarketingShellAuthRoute = (typeof MARKETING_SHELL_AUTH_ROUTES)[number];

/** Routes that mount MarketingShell instead of AppShell or bare ContentShell. */
export const MARKETING_SHELL_ROUTE_PREFIXES = [
  '/',
  ...MARKETING_SHELL_AUTH_ROUTES,
  '/auth',
] as const;

/** Ad pixel lazy host — subset of marketing shell (§28.5). */
export const MARKETING_SHELL_ATTRIBUTION_ROUTES = ADS_ATTRIBUTION_ROUTES;
