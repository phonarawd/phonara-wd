/**
 * Referral hub (`/referral`) — display contract (dashboard read · viral mission lane).
 * Money totals aggregate paid `referrals.referrer_phon` rows only — no client reward math.
 *
 * Authority: `affiliate-partner-display-contract.ts` · `viral-missions-display-contract.ts`
 */

import type { MessageKey } from '@phonara/i18n';
import { money, toDecimal } from '@phonara/money';

import { REFERRAL_PRIMARY_ROUTE } from './affiliate-partner-display-contract';

export const REFERRAL_HUB_ROUTE = REFERRAL_PRIMARY_ROUTE;
export const REFERRAL_INVITE_ROUTE = '/referral/invite' as const;

/** Viral mission rows curated for the referral hub (§18.3 P1). */
export const REFERRAL_HUB_VIRAL_MISSION_UI_IDS = [
  'viral-shareLink',
  'viral-invite3',
  'viral-inviteWeekly',
] as const;

export type ReferralHubViralMissionUiId = (typeof REFERRAL_HUB_VIRAL_MISSION_UI_IDS)[number];

export type ReferralTreeRowState = 'registered' | 'pending' | 'qualified' | 'blocked' | 'paid';

export type ReferralHubReferralRow = {
  id: string;
  referredId: string;
  state: ReferralTreeRowState;
  referrerPhon: string;
  createdAt: string;
  rewardedAt: string | null;
};

export type EarnHubReferralSnapshot = {
  totalInvited: number;
  qualifiedTotal: number;
  pendingReview: number;
  payoutTodayUsed: number;
  payoutTodayMax: number;
  payoutTodayRemaining: number;
  perFriendBonusMultiplier: string;
};

/** Matches `rpc_register_referral` lookup — username preferred, else UUID prefix. */
export function resolveReferralShareCode(
  userId: string,
  username: string | null | undefined,
): string {
  const trimmed = username?.trim();
  if (trimmed) return trimmed;
  return userId.replace(/-/g, '').slice(0, 8);
}

export function buildReferralInvitePath(code: string): string {
  return `/r/${encodeURIComponent(code)}`;
}

export function buildReferralInviteUrl(origin: string, code: string): string {
  const base = origin.replace(/\/$/, '');
  return `${base}${buildReferralInvitePath(code)}`;
}

export function maskReferredUserLabel(referredId: string): string {
  const compact = referredId.replace(/-/g, '');
  if (compact.length < 4) return '···';
  return `···${compact.slice(-4)}`;
}

export function resolveReferralTreeStateLabelKey(state: ReferralTreeRowState): MessageKey {
  switch (state) {
    case 'paid':
      return 'referral.paid';
    case 'qualified':
      return 'referral.approved';
    case 'pending':
    case 'registered':
      return 'referral.pending';
    case 'blocked':
      return 'referral.pending';
    default:
      return 'referral.pending';
  }
}

/** Sum paid referral rewards from RLS-read rows (display aggregate only). */
export function sumPaidReferralRewards(
  rows: ReadonlyArray<{ referrerPhon: string; state: string }>,
): string {
  let total = toDecimal('0');
  for (const row of rows) {
    if (row.state !== 'paid') continue;
    const amount = row.referrerPhon?.trim();
    if (!amount || amount === '0' || amount === '0.000000') continue;
    total = total.add(toDecimal(amount, 'referrer_phon'));
  }
  return money(total, 'PHON').amount;
}

export function parseEarnHubReferralSnapshot(
  payload: Record<string, unknown> | null | undefined,
): EarnHubReferralSnapshot | null {
  const referral = payload?.['referral'];
  if (!referral || typeof referral !== 'object') return null;
  const row = referral as Record<string, unknown>;
  const payout = row['payout_today'];
  const payoutRow = payout && typeof payout === 'object' ? (payout as Record<string, unknown>) : {};

  return {
    totalInvited: Number(row['total_invited'] ?? 0),
    qualifiedTotal: Number(row['qualified_total'] ?? 0),
    pendingReview: Number(row['pending_review'] ?? 0),
    payoutTodayUsed: Number(payoutRow['used'] ?? 0),
    payoutTodayMax: Number(payoutRow['max'] ?? 0),
    payoutTodayRemaining: Number(payoutRow['remaining'] ?? 0),
    perFriendBonusMultiplier: String(row['per_friend_bonus_multiplier'] ?? '1.00'),
  };
}
