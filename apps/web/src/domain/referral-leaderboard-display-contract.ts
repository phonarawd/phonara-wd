/**
 * `/referral/leaderboard` — live rank list after E3 GATE + E5 wire.
 * Engine RPC: `rpc_get_affiliate_rank_leaderboard` (qualified invite count only — no money).
 */

import type { MessageKey } from '@phonara/i18n';

import { shouldDeferPartnerRankSnapshot } from './affiliate-partner-display-contract';
import { REFERRAL_HUB_ROUTE } from './referral-hub-display-contract';
import {
  AFFILIATE_RANK_LEADERBOARD_RPC,
  AFFILIATE_RANK_WINDOWS,
  isReferralLeaderboardLiveUnlocked,
} from './viral-cms-display-contract';

export const REFERRAL_LEADERBOARD_ROUTE = '/referral/leaderboard' as const;
export const REFERRAL_LEADERBOARD_ENGINE_RPC = AFFILIATE_RANK_LEADERBOARD_RPC;
export const REFERRAL_LEADERBOARD_ENGINE_TODO = 'ew-e3-gate-cms-promotions' as const;
export const REFERRAL_LEADERBOARD_UI_UNLOCK_TODO = 'ew-e5-gap-surfaces-wire' as const;

export const REFERRAL_LEADERBOARD_DEFAULT_LIMIT = 50 as const;
export const REFERRAL_LEADERBOARD_DEFAULT_WINDOW = 'all_time' as const;

export type ReferralLeaderboardWindow = (typeof AFFILIATE_RANK_WINDOWS)[number];

export const REFERRAL_LEADERBOARD_SEO_TITLE_KEY =
  'referral.leaderboard.head.title' as const satisfies MessageKey;
export const REFERRAL_LEADERBOARD_SEO_DESCRIPTION_KEY =
  'referral.leaderboard.head.desc' as const satisfies MessageKey;

export const REFERRAL_LEADERBOARD_DEFER_TITLE_KEY =
  'referral.leaderboard.defer.title' as const satisfies MessageKey;
export const REFERRAL_LEADERBOARD_DEFER_BODY_KEY =
  'referral.leaderboard.defer.body' as const satisfies MessageKey;

export const REFERRAL_LEADERBOARD_EMPTY_LIVE_TITLE_KEY =
  'referral.leaderboard.empty.live.title' as const satisfies MessageKey;
export const REFERRAL_LEADERBOARD_EMPTY_LIVE_BODY_KEY =
  'referral.leaderboard.empty.live.body' as const satisfies MessageKey;
export const REFERRAL_LEADERBOARD_ERROR_KEY =
  'referral.leaderboard.error' as const satisfies MessageKey;
export const REFERRAL_LEADERBOARD_SELF_TITLE_KEY =
  'referral.leaderboard.self.title' as const satisfies MessageKey;

export const REFERRAL_LEADERBOARD_WINDOW_KEYS = {
  all_time: 'referral.leaderboard.window.all_time',
  '30d': 'referral.leaderboard.window.30d',
  '7d': 'referral.leaderboard.window.7d',
} as const satisfies Record<ReferralLeaderboardWindow, MessageKey>;

export type ReferralLeaderboardEntryView = {
  rank: number;
  displayName: string;
  qualifiedCount: number;
  isSelf: boolean;
};

export type ReferralLeaderboardSnapshot = {
  window: ReferralLeaderboardWindow;
  limit: number;
  generatedAt: string | null;
  entries: ReferralLeaderboardEntryView[];
  self: ReferralLeaderboardEntryView | null;
};

export function shouldDeferReferralLeaderboard(): boolean {
  return shouldDeferPartnerRankSnapshot();
}

/** E5 — rank list UI is live when GATE unlock is on (page wires RPC). */
export function isReferralLeaderboardRankListLive(): boolean {
  return isReferralLeaderboardLiveUnlocked() && !shouldDeferReferralLeaderboard();
}

export function resolveReferralLeaderboardBackRoute(): typeof REFERRAL_HUB_ROUTE {
  return REFERRAL_HUB_ROUTE;
}

export function isReferralLeaderboardWindow(
  value: string | null | undefined,
): value is ReferralLeaderboardWindow {
  return (AFFILIATE_RANK_WINDOWS as readonly string[]).includes(value ?? '');
}

function parseEntry(raw: unknown): ReferralLeaderboardEntryView | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const rank = typeof row['rank'] === 'number' ? row['rank'] : Number(row['rank']);
  const qualifiedCount =
    typeof row['qualified_count'] === 'number'
      ? row['qualified_count']
      : Number(row['qualified_count']);
  const displayNameRaw = row['display_name'];
  const displayName =
    typeof displayNameRaw === 'string' && displayNameRaw.trim().length > 0
      ? displayNameRaw.trim()
      : '—';
  if (!Number.isFinite(rank) || rank < 1) return null;
  if (!Number.isFinite(qualifiedCount) || qualifiedCount < 0) return null;
  return {
    rank: Math.trunc(rank),
    displayName,
    qualifiedCount: Math.trunc(qualifiedCount),
    isSelf: row['is_self'] === true,
  };
}

/**
 * Parse RPC JSON — rank / masked name / qualified invite count only.
 * Never invent rows or money columns.
 */
export function parseAffiliateRankLeaderboard(
  raw: unknown,
  fallbackWindow: ReferralLeaderboardWindow = REFERRAL_LEADERBOARD_DEFAULT_WINDOW,
): ReferralLeaderboardSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const payload = raw as Record<string, unknown>;
  if (payload['ok'] === false) return null;

  const windowRaw =
    typeof payload['window'] === 'string' ? payload['window'] : fallbackWindow;
  const window = isReferralLeaderboardWindow(windowRaw) ? windowRaw : fallbackWindow;
  const limit =
    typeof payload['limit'] === 'number' && Number.isFinite(payload['limit'])
      ? Math.trunc(payload['limit'])
      : REFERRAL_LEADERBOARD_DEFAULT_LIMIT;

  const entriesRaw = Array.isArray(payload['entries']) ? payload['entries'] : [];
  const entries: ReferralLeaderboardEntryView[] = [];
  for (const item of entriesRaw) {
    const parsed = parseEntry(item);
    if (parsed) entries.push(parsed);
  }

  const self = payload['self'] == null ? null : parseEntry(payload['self']);
  const generatedAt =
    typeof payload['generated_at'] === 'string' ? payload['generated_at'] : null;

  return { window, limit, generatedAt, entries, self };
}

export function resolveReferralLeaderboardWindowKey(
  window: ReferralLeaderboardWindow,
): MessageKey {
  return REFERRAL_LEADERBOARD_WINDOW_KEYS[window];
}
