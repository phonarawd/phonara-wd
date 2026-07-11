/**
 * `/referral/leaderboard` — STUB until `affiliate_rank_leaderboard` engine (E3).
 * Presentation empty state only — no fake ranks as money truth.
 */

import type { MessageKey } from '@phonara/i18n';

import { shouldDeferPartnerRankSnapshot } from './affiliate-partner-display-contract';
import { REFERRAL_HUB_ROUTE } from './referral-hub-display-contract';

export const REFERRAL_LEADERBOARD_ROUTE = '/referral/leaderboard' as const;
export const REFERRAL_LEADERBOARD_ENGINE_TODO = 'ew-e3-gate-cms-promotions' as const;
export const REFERRAL_LEADERBOARD_UI_UNLOCK_TODO = 'ew-e5-gap-surfaces-wire' as const;

export const REFERRAL_LEADERBOARD_SEO_TITLE_KEY =
  'referral.leaderboard.head.title' as const satisfies MessageKey;
export const REFERRAL_LEADERBOARD_SEO_DESCRIPTION_KEY =
  'referral.leaderboard.head.desc' as const satisfies MessageKey;

export const REFERRAL_LEADERBOARD_DEFER_TITLE_KEY =
  'referral.leaderboard.defer.title' as const satisfies MessageKey;
export const REFERRAL_LEADERBOARD_DEFER_BODY_KEY =
  'referral.leaderboard.defer.body' as const satisfies MessageKey;

export function shouldDeferReferralLeaderboard(): boolean {
  return shouldDeferPartnerRankSnapshot();
}

export function resolveReferralLeaderboardBackRoute(): typeof REFERRAL_HUB_ROUTE {
  return REFERRAL_HUB_ROUTE;
}
