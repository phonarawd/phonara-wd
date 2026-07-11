/**
 * PQA F3 — dead control / defer stub registry (Plan §33.3 #5 · §32.7 H1).
 * Visible control = live | disabled+reason | built_hidden — never silent no-op.
 */
import type { MessageKey } from '@phonara/i18n';

import { CASINO_HUB_ROUTE } from './tournaments-pf-admin-display-contract';
import {
  REFERRAL_LEADERBOARD_DEFER_BODY_KEY,
  REFERRAL_LEADERBOARD_ENGINE_TODO,
  REFERRAL_LEADERBOARD_ROUTE,
  REFERRAL_LEADERBOARD_UI_UNLOCK_TODO,
} from './referral-leaderboard-display-contract';
import {
  SETTINGS_API_KEYS_ENGINE_TODO,
  SETTINGS_API_KEYS_ROUTE,
  SETTINGS_API_KEYS_UI_UNLOCK_TODO,
} from './settings-api-keys-display-contract';
import {
  SUPPORT_TICKET_DEFER_BODY_KEY,
  SUPPORT_TICKET_ENGINE_TODO,
  SUPPORT_TICKET_ROUTE,
  SUPPORT_TICKET_UI_UNLOCK_TODO,
} from './support-hub-display-contract';
import {
  SYSTEM_STATUS_DEFER_BODY_KEY,
  SYSTEM_STATUS_ENGINE_TODO,
  SYSTEM_STATUS_ROUTE,
  SYSTEM_STATUS_UI_UNLOCK_TODO,
} from './system-status-display-contract';
import { TIER_KEEP_STATUS_RPC, TIER_KEEP_STATUS_UI_ID } from './tier-me-display-contract';

export const PQA_FIX_DEAD_CONTROLS_TODO = 'pqa-fix-dead-controls' as const;

export const CASINO_ROUND_HOOK_OWNER = 'apps/web/src/features/casino/use-casino-round.ts' as const;
/** CasinoR#1 shell mounts pipeline — per-game stages remain batch todos. */
export const CASINO_HUB_DEFER_TODO = 'p10-casino-replay-and-infra' as const;
export const CASINO_GAME_SHELL_LIVE_TODO = 'p10-casino-replay-and-infra' as const;

/** Lobby discovery is live (`p10-page-casino`) — hub stub row mitigatedBy=live. */
export const CASINO_LOBBY_LIVE_TODO = 'p10-page-casino' as const;

export const SPORTS_VIP_ROUTE = '/sports/vip' as const;
export const SPORTS_VIP_ENGINE_TODO = 'ew-e4-gate-tier-option-b' as const;
export const SPORTS_VIP_UI_UNLOCK_TODO = 'ew-e5-gap-surfaces-wire' as const;

export const TIER_KEEP_STATUS_ENGINE_TODO = 'ew-e1-decay-wave' as const;

/** Grant RPC for `user_reward_tickets` — read-only hub until operator ADR (48th audit). */
export const REWARD_TICKETS_ISSUANCE_STATUS = 'read_only_no_grant_rpc' as const;

export type DeadControlMitigation = 'live' | 'disabled+key' | 'built_hidden' | 'defer_stub';

export type DeadControlDeferRow = {
  id: string;
  route: string;
  mitigatedBy: DeadControlMitigation;
  disabledReasonKey?: MessageKey;
  engineTodo: string;
  uiUnlockTodo?: string;
  note: string;
};

export const TIER_KEEP_STATUS_UNAVAILABLE_REASON_KEY =
  'earn.mission.unavailable.tierKeepStatus' as const satisfies MessageKey;

export const CASINO_HUB_DEFER_REASON_KEY = 'casino.hub.defer.body' as const satisfies MessageKey;

export const SPORTS_VIP_DEFER_REASON_KEY = 'sports.vip.defer.body' as const satisfies MessageKey;

export const REFERRAL_LEADERBOARD_DEFER_REASON_KEY = REFERRAL_LEADERBOARD_DEFER_BODY_KEY;

export const SUPPORT_TICKET_DEFER_REASON_KEY = SUPPORT_TICKET_DEFER_BODY_KEY;

export const SYSTEM_STATUS_DEFER_REASON_KEY = SYSTEM_STATUS_DEFER_BODY_KEY;

export const SETTINGS_API_KEYS_CREATE_DISABLED_REASON_KEY =
  'settings.apiKeys.create.disabledHint' as const satisfies MessageKey;

export const REWARD_TICKETS_ZERO_ISSUANCE_NOTE_KEY =
  'earn.home.tickets.issuanceNote' as const satisfies MessageKey;

export const PQA_DEAD_CONTROL_DEFER_REGISTRY: readonly DeadControlDeferRow[] = [
  {
    id: 'casino-route-hub-stub',
    route: CASINO_HUB_ROUTE,
    mitigatedBy: 'live',
    engineTodo: CASINO_LOBBY_LIVE_TODO,
    note: 'p10-page-casino lobby live — category/featured/grid · play surfaces still deferred',
  },
  {
    id: 'casino-round-hook-orphan',
    route: '/games/$gameCode',
    mitigatedBy: 'live',
    engineTodo: CASINO_GAME_SHELL_LIVE_TODO,
    note: 'CasinoGameShell mounts useCasinoRoundPipeline · Batch A/B/C (crash·limbo·dice·mines·hilo·plinko·mint_reels·gold_rush·momentum) L1 live · Batch D deferred to p10-games-batch-d',
  },
  {
    id: 'settings-api-keys-stub',
    route: SETTINGS_API_KEYS_ROUTE,
    mitigatedBy: 'live',
    engineTodo: SETTINGS_API_KEYS_ENGINE_TODO,
    uiUnlockTodo: SETTINGS_API_KEYS_UI_UNLOCK_TODO,
    note: 'Trading bot API E10 live — hub IA + list/create/revoke via financialConnectivityLive',
  },
  {
    id: 'sports-vip-coming-soon',
    route: SPORTS_VIP_ROUTE,
    mitigatedBy: 'live',
    disabledReasonKey: SPORTS_VIP_DEFER_REASON_KEY,
    engineTodo: SPORTS_VIP_ENGINE_TODO,
    uiUnlockTodo: SPORTS_VIP_UI_UNLOCK_TODO,
    note: 'E5 ew-e5-gap-surfaces-wire — VIP room browses shared fixtures · Platinum+ eligibility · stake caps Option B',
  },
  {
    id: 'referral-leaderboard-stub',
    route: REFERRAL_LEADERBOARD_ROUTE,
    mitigatedBy: 'live',
    disabledReasonKey: REFERRAL_LEADERBOARD_DEFER_REASON_KEY,
    engineTodo: REFERRAL_LEADERBOARD_ENGINE_TODO,
    uiUnlockTodo: REFERRAL_LEADERBOARD_UI_UNLOCK_TODO,
    note: 'E5 ew-e5-gap-surfaces-wire — rpc_get_affiliate_rank_leaderboard live rank list (qualified count only)',
  },
  {
    id: 'support-ticket-stub',
    route: SUPPORT_TICKET_ROUTE,
    mitigatedBy: 'defer_stub',
    disabledReasonKey: SUPPORT_TICKET_DEFER_REASON_KEY,
    engineTodo: SUPPORT_TICKET_ENGINE_TODO,
    uiUnlockTodo: SUPPORT_TICKET_UI_UNLOCK_TODO,
    note: 'Support tickets E9 engine ready — IA built_hidden · direct URL defer stub until admin/E10 UI unlock',
  },
  {
    id: 'system-status-stub',
    route: SYSTEM_STATUS_ROUTE,
    mitigatedBy: 'defer_stub',
    disabledReasonKey: SYSTEM_STATUS_DEFER_REASON_KEY,
    engineTodo: SYSTEM_STATUS_ENGINE_TODO,
    uiUnlockTodo: SYSTEM_STATUS_UI_UNLOCK_TODO,
    note: 'Public /status ENGINE:gap — IA built_hidden · direct URL defer stub until E10',
  },
  {
    id: 'tier-keep-status-claim-blocked',
    route: '/tier/me',
    mitigatedBy: 'live',
    engineTodo: TIER_KEEP_STATUS_ENGINE_TODO,
    note: 'E1 ew-e1-decay-wave — tier_keep_status progress live · claim when maintenance met',
  },
  {
    id: 'user-reward-tickets-zero-issuance',
    route: '/home',
    mitigatedBy: 'disabled+key',
    disabledReasonKey: REWARD_TICKETS_ZERO_ISSUANCE_NOTE_KEY,
    engineTodo: REWARD_TICKETS_ISSUANCE_STATUS,
    note: 'rpc_get_earn_hub_status reads tickets · grant RPC 0 — display 0 honestly',
  },
] as const;

export function isTierKeepStatusMission(uiId: string): boolean {
  return uiId === TIER_KEEP_STATUS_UI_ID;
}

/** E1 decay RPC shipped — tier keep mission claim is live when progress met. */
export function isTierKeepStatusClaimEngineLive(): boolean {
  return true;
}

export function resolveTierKeepStatusUnavailableReason(uiId: string): MessageKey | null {
  if (!isTierKeepStatusMission(uiId)) return null;
  if (isTierKeepStatusClaimEngineLive()) return null;
  return TIER_KEEP_STATUS_UNAVAILABLE_REASON_KEY;
}

export function resolveMissionUnavailableReason(params: {
  authenticated: boolean;
  uiId: string;
}): MessageKey | null {
  if (!params.authenticated) return null;
  return resolveTierKeepStatusUnavailableReason(params.uiId);
}

export function resolveCasinoHubDeferReasonKey(): typeof CASINO_HUB_DEFER_REASON_KEY {
  return CASINO_HUB_DEFER_REASON_KEY;
}

export function resolveSportsVipDeferReasonKey(): typeof SPORTS_VIP_DEFER_REASON_KEY {
  return SPORTS_VIP_DEFER_REASON_KEY;
}

export function resolveSettingsApiKeysCreateDisabledReasonKey(): typeof SETTINGS_API_KEYS_CREATE_DISABLED_REASON_KEY {
  return SETTINGS_API_KEYS_CREATE_DISABLED_REASON_KEY;
}

export function resolveRewardTicketsIssuanceNoteKey(): typeof REWARD_TICKETS_ZERO_ISSUANCE_NOTE_KEY {
  return REWARD_TICKETS_ZERO_ISSUANCE_NOTE_KEY;
}

export function shouldShowRewardTicketsIssuanceNote(): boolean {
  return true;
}

export function formatRewardTicketCount(count: number): string {
  return Number.isFinite(count) && count >= 0 ? String(count) : '0';
}

export function assertPqaDeadControlRegistry(): void {
  for (const row of PQA_DEAD_CONTROL_DEFER_REGISTRY) {
    if (row.mitigatedBy === 'disabled+key' && !row.disabledReasonKey) {
      throw new Error(`dead-controls: ${row.id} missing disabledReasonKey`);
    }
  }
  if (!PQA_DEAD_CONTROL_DEFER_REGISTRY.some((row) => row.id === 'tier-keep-status-claim-blocked')) {
    throw new Error('dead-controls: tier_keep_status row missing');
  }
  if (TIER_KEEP_STATUS_RPC !== 'tier_keep_status') {
    throw new Error('dead-controls: tier_keep_status RPC drift');
  }
}
