/**
 * `/tier/leaderboard` — live VIP XP rank list after E9 engine · E10 UI unlock.
 * Engine RPC: `rpc_get_tier_leaderboard` (masked names · XP · tier — no money).
 */

import type { MessageKey } from '@phonara/i18n';

import { LAUNCH_GATES } from '../lib/launch-gates';
import { EW_E9_TIER_LEADERBOARD_RPC } from './ew-e9-identity-support-display-contract';
import { PLATFORM_EWAVE_HIDDEN_ROUTES } from './platform-narrative-display-contract';
import { TIER_ME_ROUTE } from './tier-me-display-contract';
import {
  EARN_VIP_TIER_ORDER,
  normalizeEarnVipTier,
  type EarnVipTier,
} from './unified-tier-display-contract';

export const TIER_LEADERBOARD_ROUTE = '/tier/leaderboard' as const;
export const TIER_LEADERBOARD_ENGINE_RPC = EW_E9_TIER_LEADERBOARD_RPC;
export const TIER_LEADERBOARD_ENGINE_TODO = 'ew-e9-identity-wave' as const;
export const TIER_LEADERBOARD_UI_UNLOCK_TODO = 'ew-e10-trust-support-ui' as const;

export const TIER_LEADERBOARD_DEFAULT_LIMIT = 50 as const;

export const TIER_LEADERBOARD_SEO_TITLE_KEY =
  'tier.leaderboard.head.title' as const satisfies MessageKey;
export const TIER_LEADERBOARD_SEO_DESCRIPTION_KEY =
  'tier.leaderboard.head.desc' as const satisfies MessageKey;

export const TIER_LEADERBOARD_DEFER_TITLE_KEY =
  'tier.leaderboard.defer.title' as const satisfies MessageKey;
export const TIER_LEADERBOARD_DEFER_BODY_KEY =
  'tier.leaderboard.defer.body' as const satisfies MessageKey;

export const TIER_LEADERBOARD_EMPTY_LIVE_TITLE_KEY =
  'tier.leaderboard.empty.live.title' as const satisfies MessageKey;
export const TIER_LEADERBOARD_EMPTY_LIVE_BODY_KEY =
  'tier.leaderboard.empty.live.body' as const satisfies MessageKey;
export const TIER_LEADERBOARD_ERROR_KEY = 'tier.leaderboard.error' as const satisfies MessageKey;
export const TIER_LEADERBOARD_SELF_TITLE_KEY =
  'tier.leaderboard.self.title' as const satisfies MessageKey;

export type TierLeaderboardEntryView = {
  rank: number;
  displayName: string;
  tier: EarnVipTier;
  xp: number;
  isSelf: boolean;
};

export type TierLeaderboardSnapshot = {
  limit: number;
  generatedAt: string | null;
  entries: TierLeaderboardEntryView[];
  self: TierLeaderboardEntryView | null;
};

export function shouldDeferTierLeaderboard(): boolean {
  return (PLATFORM_EWAVE_HIDDEN_ROUTES as readonly string[]).includes(TIER_LEADERBOARD_ROUTE);
}

export function isTierLeaderboardLiveUnlocked(): boolean {
  return LAUNCH_GATES.tierLeaderboardLive === true;
}

/** E10 — rank list UI is live when launch gate + route exposure are on. */
export function isTierLeaderboardRankListLive(): boolean {
  return (
    isTierLeaderboardLiveUnlocked() &&
    !shouldDeferTierLeaderboard() &&
    TIER_LEADERBOARD_ENGINE_RPC === 'rpc_get_tier_leaderboard'
  );
}

export function resolveTierLeaderboardBackRoute(): typeof TIER_ME_ROUTE {
  return TIER_ME_ROUTE;
}

export function resolveTierLabelKey(tier: EarnVipTier): `earn.tier.${EarnVipTier}` {
  return `earn.tier.${tier}`;
}

function parseEntry(raw: unknown): TierLeaderboardEntryView | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const rank = typeof row['rank'] === 'number' ? row['rank'] : Number(row['rank']);
  const xp = typeof row['xp'] === 'number' ? row['xp'] : Number(row['xp']);
  const tierRaw = typeof row['tier'] === 'string' ? row['tier'] : '';
  const tier = normalizeEarnVipTier(tierRaw);
  const displayNameRaw = row['display_name'];
  const displayName =
    typeof displayNameRaw === 'string' && displayNameRaw.trim().length > 0
      ? displayNameRaw.trim()
      : '—';
  if (!Number.isFinite(rank) || rank < 1) return null;
  if (!Number.isFinite(xp) || xp < 0) return null;
  if (!(EARN_VIP_TIER_ORDER as readonly string[]).includes(tier)) return null;
  return {
    rank: Math.trunc(rank),
    displayName,
    tier,
    xp: Math.trunc(xp),
    isSelf: row['is_self'] === true,
  };
}

/** Parse RPC JSON — rank / masked name / tier / xp only. Never invent rows. */
export function parseTierLeaderboard(raw: unknown): TierLeaderboardSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const payload = raw as Record<string, unknown>;
  if (payload['ok'] === false) return null;

  const limit =
    typeof payload['limit'] === 'number' && Number.isFinite(payload['limit'])
      ? Math.trunc(payload['limit'])
      : TIER_LEADERBOARD_DEFAULT_LIMIT;

  const entriesRaw = Array.isArray(payload['entries']) ? payload['entries'] : [];
  const entries: TierLeaderboardEntryView[] = [];
  for (const item of entriesRaw) {
    const parsed = parseEntry(item);
    if (parsed) entries.push(parsed);
  }

  const self = payload['self'] == null ? null : parseEntry(payload['self']);
  const generatedAt = typeof payload['generated_at'] === 'string' ? payload['generated_at'] : null;

  return { limit, generatedAt, entries, self };
}

export function assertTierLeaderboardLiveSync(): void {
  if (TIER_LEADERBOARD_ROUTE !== '/tier/leaderboard') {
    throw new Error('tier-leaderboard: canonical route drift');
  }
  if (!isTierLeaderboardRankListLive()) {
    throw new Error('tier-leaderboard: rank list must be live after E10 unlock');
  }
}
