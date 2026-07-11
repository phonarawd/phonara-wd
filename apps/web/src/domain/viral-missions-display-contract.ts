/**

 * Viral / repeatable missions — Phase 1 E12 discovery contract (mission type matrix + abuse gates).

 * Rewards and quotas are engine/RPC only; this module defines placement, exposure, and card states.

 *

 * Authority: `docs/ENGINE_APEX_CLOSEOUT.md` (frozen) · `docs/SSOT/ENGINE_BOUNDARY.md` §E12

 */

import type { MessageKey } from '@phonara/i18n';
import type { MissionItem, MissionLane, MissionStatus } from '@phonara/shared-types';

import {
  isTierKeepStatusClaimEngineLive,
  isTierKeepStatusMission,
  resolveTierKeepStatusUnavailableReason,
  TIER_KEEP_STATUS_UNAVAILABLE_REASON_KEY,
} from './dead-controls-display-contract';

/** Must match `tier-me-display-contract` — local copy breaks tier-me → home-missions → viral cycle. */
const TIER_KEEP_STATUS_UI_ID = 'tier-keepStatus' as const;

export const VIRAL_STATUS_RPC = 'rpc_get_viral_mission_status' as const;

export const VIRAL_CLAIM_RPC = 'rpc_claim_viral_mission' as const;

export const REPEATABLE_STATUS_RPC = 'rpc_get_repeatable_mission_status' as const;

export const REPEATABLE_CLAIM_RPC = 'rpc_claim_repeatable_mission' as const;

/** Single canonical owner for viral/repeatable mission sections (E12 duplicate-owner gate). */

export const VIRAL_MISSIONS_PRIMARY_ROUTE = '/home/missions' as const;

export type ViralMissionRpc =
  | 'share_referral_link'
  | 'share_story_template'
  | 'invite_friend_signup'
  | 'affiliate_content_post'
  | 'viral_streak_share';

export type RepeatableMissionRpc =
  | 'weekly_play5'
  | 'weekly_win3'
  | 'weekly_deposit_once'
  | 'weekly_spin_daily'
  | 'weekly_login_all'
  | 'social_follow_x'
  | 'social_join_telegram'
  | 'social_share_win'
  | 'social_join_discord'
  | 'tier_reach_silver'
  | 'tier_reach_gold'
  | 'tier_fomo_streak'
  | 'tier_keep_status'
  | 'daily_today_spin'
  | 'daily_quiz';

export type MissionEngineStatus = 'exists' | 'partial' | 'missing';

export type MissionExposureMode = 'live' | 'built_hidden' | 'defer_stub';

/** UI card states — in_progress / reward_pending / completed (plan §15 viral/repeatable 3-state). */

export type MissionCardDisplayState = 'in_progress' | 'reward_pending' | 'completed';

export type MissionMatrixRow = {
  uiId: string;

  rpc: ViralMissionRpc | RepeatableMissionRpc | null;

  lane: MissionLane;

  engine: MissionEngineStatus;

  exposure: MissionExposureMode;

  /** Server-side abuse gate summary — UI must not bypass. */

  abuseGate: string;
};

export const VIRAL_UI_TO_RPC: Readonly<Record<string, ViralMissionRpc>> = {
  'viral-shareLink': 'share_referral_link',

  'viral-invite3': 'invite_friend_signup',

  'viral-partnerHubVisit': 'affiliate_content_post',

  'viral-inviteWeekly': 'viral_streak_share',
};

export const REPEATABLE_UI_TO_RPC: Readonly<Record<string, RepeatableMissionRpc>> = {
  'weekly-play5': 'weekly_play5',

  'weekly-win3': 'weekly_win3',

  'weekly-depositOnce': 'weekly_deposit_once',

  'weekly-spinDaily': 'weekly_spin_daily',

  'weekly-loginAll': 'weekly_login_all',

  'social-followX': 'social_follow_x',

  'social-joinTelegram': 'social_join_telegram',

  'social-shareWin': 'social_share_win',

  'social-joinDiscord': 'social_join_discord',

  'tier-reachSilver': 'tier_reach_silver',

  'tier-reachGold': 'tier_reach_gold',

  'tier-fomoStreak': 'tier_fomo_streak',

  'tier-keepStatus': 'tier_keep_status',

  'daily-todaySpin': 'daily_today_spin',

  'daily-quiz': 'daily_quiz',
};

export const ENGINE_ONE_SHOT_MISSION_TO_UI: Readonly<Record<string, string>> = {
  complete_profile: 'growth-completeProfile',

  first_trade: 'growth-firstGame',

  first_deposit: 'growth-firstDeposit',

  kyc_verified: 'growth-kyc',

  invite_3_friends: 'viral-invite3',
};

/** Claim RPC rate limit — migration `20260615000098` (`10` capacity / `60s` window). */

export const VIRAL_CLAIM_RATE_LIMIT = { capacity: 10, windowSec: 60 } as const;

export const VIRAL_MISSION_MATRIX: Readonly<MissionMatrixRow[]> = [
  {
    uiId: 'viral-shareLink',

    rpc: 'share_referral_link',

    lane: 'viral',

    engine: 'exists',

    exposure: 'live',

    abuseGate: 'quota:3/day · rate_limit:rpc_claim_viral_mission',
  },

  {
    uiId: 'viral-invite3',

    rpc: 'invite_friend_signup',

    lane: 'viral',

    engine: 'exists',

    exposure: 'live',

    abuseGate: 'quota:5/day · eligibility:referral_today · rate_limit',
  },

  {
    uiId: 'viral-partnerHubVisit',

    rpc: 'affiliate_content_post',

    lane: 'viral',

    engine: 'exists',

    exposure: 'live',

    abuseGate: 'quota:1/month · rate_limit',
  },

  {
    uiId: 'viral-inviteWeekly',

    rpc: 'viral_streak_share',

    lane: 'viral',

    engine: 'exists',

    exposure: 'live',

    abuseGate: 'quota:1/day · eligibility:streak_min_days · rate_limit',
  },

  {
    uiId: 'viral-invite1',

    rpc: null,

    lane: 'viral',

    engine: 'missing',

    exposure: 'defer_stub',

    abuseGate: 'n/a — no engine RPC (invite_friend_signup covers signup track)',
  },

  {
    uiId: 'share_story_template',

    rpc: 'share_story_template',

    lane: 'viral',

    engine: 'exists',

    exposure: 'built_hidden',

    abuseGate: 'quota:2/week · UI row not mounted until Phase 7 copy',
  },
];

const REPEATABLE_MISSION_MATRIX_LIVE: Readonly<MissionMatrixRow[]> = Object.entries(
  REPEATABLE_UI_TO_RPC,
)
  .filter(([uiId]) => uiId !== TIER_KEEP_STATUS_UI_ID)
  .map(([uiId, rpc]) => ({
    uiId,
    rpc,
    lane: uiId.split('-')[0] as MissionLane,
    engine: 'exists' as const,
    exposure: 'live' as const,
    abuseGate: 'window_claim_once · idempotent client_request_id · tier limits via hub',
  }));

export const REPEATABLE_MISSION_MATRIX: Readonly<MissionMatrixRow[]> = [
  ...REPEATABLE_MISSION_MATRIX_LIVE,
  {
    uiId: TIER_KEEP_STATUS_UI_ID,
    rpc: 'tier_keep_status',
    lane: 'tier',
    engine: 'exists',
    exposure: 'live',
    abuseGate:
      'E1 ew-e1-decay-wave — maintenance progress · monthly window claim · idempotent client_request_id',
  },
];

export const E12_MISSION_MATRIX: Readonly<MissionMatrixRow[]> = [
  ...VIRAL_MISSION_MATRIX,

  ...REPEATABLE_MISSION_MATRIX,
];

/** Lanes that render E12 3-state cards on `/home/missions`. */

export const E12_CARD_LANES: Readonly<MissionLane[]> = ['viral', 'weekly', 'tier', 'social'];

export function resolveMissionMatrixRow(uiId: string): MissionMatrixRow | null {
  return E12_MISSION_MATRIX.find((row) => row.uiId === uiId) ?? null;
}

export function resolveMissionExposure(uiId: string): MissionExposureMode {
  const row = resolveMissionMatrixRow(uiId);

  if (!row) return 'defer_stub';

  return row.exposure;
}

export function shouldDeferMissionRow(uiId: string): boolean {
  const exposure = resolveMissionExposure(uiId);

  return exposure === 'defer_stub' || exposure === 'built_hidden';
}

export function usesE12MissionCard(lane: MissionLane): boolean {
  return (E12_CARD_LANES as readonly string[]).includes(lane);
}

/** True when row is backed by viral/repeatable RPC matrix (includes daily repeatable rows). */
export function usesE12MissionCardForItem(uiId: string, lane: MissionLane): boolean {
  if (usesE12MissionCard(lane)) return true;
  return uiId in VIRAL_UI_TO_RPC || uiId in REPEATABLE_UI_TO_RPC;
}

export function mapCardStateToMissionStatus(state: MissionCardDisplayState): MissionStatus {
  switch (state) {
    case 'reward_pending':
      return 'claimable';

    case 'completed':
      return 'done';

    default:
      return 'todo';
  }
}

export function mapMissionStatusToCardState(status: MissionStatus): MissionCardDisplayState {
  switch (status) {
    case 'claimable':
      return 'reward_pending';

    case 'done':
      return 'completed';

    default:
      return 'in_progress';
  }
}

export type ViralMissionStatusRow = {
  mission: string;

  used: number;

  max: number;

  remaining: number;

  reward_phon: string;
};

export type RepeatableMissionStatusRow = {
  mission: string;

  progress: number;

  target: number;

  claimed: boolean;

  claimable: boolean;

  reward_phon: string;
};

export type EngineOneShotMissionRow = {
  mission: string;

  completed_at: string | null;
};

export function resolveViralMissionCardState(
  row: ViralMissionStatusRow,

  params?: { streakDays?: number; streakTargetDays?: number },
): MissionCardDisplayState {
  if (row.remaining <= 0 || row.used >= row.max) {
    return 'completed';
  }

  if (row.mission === 'viral_streak_share') {
    const streak = params?.streakDays ?? 0;

    const target = params?.streakTargetDays ?? 7;

    if (streak < target) return 'in_progress';
  }

  return 'reward_pending';
}

export function resolveRepeatableMissionCardState(
  row: RepeatableMissionStatusRow,
): MissionCardDisplayState {
  if (row.claimed) return 'completed';

  if (row.claimable) return 'reward_pending';

  return 'in_progress';
}

/** Blocks claim CTA when guest or mission is defer_stub — engine enforces quotas on RPC. */

export function resolveMissionClaimBlocked(params: {
  authenticated: boolean;

  uiId: string;
}): boolean {
  if (!params.authenticated) return true;

  if (resolveTierKeepStatusUnavailableReason(params.uiId)) return true;

  return shouldDeferMissionRow(params.uiId);
}

export function resolveMissionUnavailableReasonKey(params: {
  authenticated: boolean;

  uiId: string;
}): MessageKey | null {
  if (!params.authenticated) return null;

  return resolveTierKeepStatusUnavailableReason(params.uiId);
}

export { TIER_KEEP_STATUS_UNAVAILABLE_REASON_KEY, isTierKeepStatusMission };

export function formatPhonRewardDisplay(phon: string): string {
  const trimmed = phon.trim();

  if (!trimmed || trimmed === '0' || trimmed === '0.000000') return '—';

  const numeric = Number.parseFloat(trimmed);

  if (!Number.isFinite(numeric)) return `${trimmed}P`;

  const formatted =
    numeric >= 1000
      ? numeric.toLocaleString(undefined, { maximumFractionDigits: 0 })
      : numeric.toLocaleString(undefined, { maximumFractionDigits: 2 });

  return `+${formatted}P`;
}

export function mergeE12MissionItems(params: {
  staticItems: MissionItem[];

  engineMissions: EngineOneShotMissionRow[];

  viralRows: ViralMissionStatusRow[];

  repeatableRows: RepeatableMissionStatusRow[];

  streakDays?: number;

  streakTargetDays?: number;
}): MissionItem[] {
  const completedUiIds = new Set<string>();

  for (const row of params.engineMissions) {
    if (!row.completed_at) continue;

    const uiId = ENGINE_ONE_SHOT_MISSION_TO_UI[row.mission] ?? row.mission;

    completedUiIds.add(uiId);
  }

  const viralByRpc = new Map(params.viralRows.map((m) => [m.mission, m]));

  const repeatableByRpc = new Map(params.repeatableRows.map((m) => [m.mission, m]));

  return params.staticItems.map((item) => {
    if (completedUiIds.has(item.id)) {
      return { ...item, soon: false, status: 'done' as const };
    }

    const matrixRow = resolveMissionMatrixRow(item.id);

    const defer = shouldDeferMissionRow(item.id);

    const viralRpc = VIRAL_UI_TO_RPC[item.id];

    if (viralRpc) {
      const row = viralByRpc.get(viralRpc);

      if (row) {
        const cardState = resolveViralMissionCardState(row, {
          streakDays: params.streakDays,

          streakTargetDays: params.streakTargetDays,
        });

        return {
          ...item,

          soon: defer,

          rewardLabel: formatPhonRewardDisplay(row.reward_phon),

          rewardPhon: row.reward_phon,

          progressLabel: `${row.used} / ${row.max}`,

          status: mapCardStateToMissionStatus(cardState),
        };
      }

      if (matrixRow?.engine === 'exists') {
        return { ...item, soon: defer };
      }
    }

    const repRpc = REPEATABLE_UI_TO_RPC[item.id];

    if (repRpc) {
      const row = repeatableByRpc.get(repRpc);

      if (row) {
        const tierKeepBlocked =
          isTierKeepStatusMission(item.id) && !isTierKeepStatusClaimEngineLive();

        const cardState = tierKeepBlocked ? 'in_progress' : resolveRepeatableMissionCardState(row);

        return {
          ...item,

          soon: defer,

          rewardLabel: formatPhonRewardDisplay(row.reward_phon),

          rewardPhon: row.reward_phon,

          progressLabel: tierKeepBlocked ? `0 / ${row.target}` : `${row.progress} / ${row.target}`,

          status: mapCardStateToMissionStatus(cardState),
        };
      }

      if (matrixRow?.engine === 'exists') {
        return { ...item, soon: defer };
      }
    }

    if (matrixRow) {
      return { ...item, soon: defer };
    }

    return { ...item, soon: false };
  });
}

/** Phase 1 audit (2026-07-02): checklist wired; E12 cards on viral/weekly/tier/social lanes. */

export const VIRAL_MISSIONS_UI_WIRE_STATUS = {
  route: VIRAL_MISSIONS_PRIMARY_ROUTE,

  checklist: 'wired' as const,

  e12Cards: 'wired' as const,

  shareStoryTemplateRow: 'built_hidden' as const,
};
