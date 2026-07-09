/**
 * PQA F3 — dead control / defer stub registry (Plan §33.3 #5 · §32.7 H1).
 * Visible control = live | disabled+reason | built_hidden — never silent no-op.
 */
import type { MessageKey } from '@phonara/i18n';

import { CASINO_HUB_ROUTE } from './tournaments-pf-admin-display-contract';
import {
  SETTINGS_API_KEYS_ENGINE_TODO,
  SETTINGS_API_KEYS_ROUTE,
  SETTINGS_API_KEYS_UI_UNLOCK_TODO,
} from './settings-api-keys-display-contract';
import { TIER_KEEP_STATUS_RPC, TIER_KEEP_STATUS_UI_ID } from './tier-me-display-contract';

export const PQA_FIX_DEAD_CONTROLS_TODO = 'pqa-fix-dead-controls' as const;

export const CASINO_ROUND_HOOK_OWNER = 'apps/web/src/features/casino/use-casino-round.ts' as const;
export const CASINO_HUB_DEFER_TODO = 'p10-casino-replay-and-infra' as const;

export const SPORTS_VIP_ROUTE = '/sports/vip' as const;
export const SPORTS_VIP_ENGINE_TODO = 'ew-e4-gate-tier-option-b' as const;
export const SPORTS_VIP_UI_UNLOCK_TODO = 'ew-e5-page-sports-vip' as const;

export const TIER_KEEP_STATUS_ENGINE_TODO = 'ew-e1-engine-decay-rpc' as const;

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

export const SETTINGS_API_KEYS_CREATE_DISABLED_REASON_KEY =
  'settings.apiKeys.create.disabledHint' as const satisfies MessageKey;

export const REWARD_TICKETS_ZERO_ISSUANCE_NOTE_KEY =
  'earn.home.tickets.issuanceNote' as const satisfies MessageKey;

export const PQA_DEAD_CONTROL_DEFER_REGISTRY: readonly DeadControlDeferRow[] = [
  {
    id: 'casino-route-hub-stub',
    route: CASINO_HUB_ROUTE,
    mitigatedBy: 'defer_stub',
    disabledReasonKey: CASINO_HUB_DEFER_REASON_KEY,
    engineTodo: CASINO_HUB_DEFER_TODO,
    note: 'DomainHub replaced — game surfaces deferred to P10 casino infra',
  },
  {
    id: 'casino-round-hook-orphan',
    route: CASINO_HUB_ROUTE,
    mitigatedBy: 'defer_stub',
    engineTodo: CASINO_HUB_DEFER_TODO,
    note: 'useCasinoRoundPipeline exists · 0 mounted game surfaces until P10',
  },
  {
    id: 'settings-api-keys-stub',
    route: SETTINGS_API_KEYS_ROUTE,
    mitigatedBy: 'disabled+key',
    disabledReasonKey: SETTINGS_API_KEYS_CREATE_DISABLED_REASON_KEY,
    engineTodo: SETTINGS_API_KEYS_ENGINE_TODO,
    uiUnlockTodo: SETTINGS_API_KEYS_UI_UNLOCK_TODO,
    note: 'Trading bot API ENGINE:gap — hub IA built_hidden · direct URL defer stub',
  },
  {
    id: 'sports-vip-coming-soon',
    route: SPORTS_VIP_ROUTE,
    mitigatedBy: 'defer_stub',
    disabledReasonKey: SPORTS_VIP_DEFER_REASON_KEY,
    engineTodo: SPORTS_VIP_ENGINE_TODO,
    uiUnlockTodo: SPORTS_VIP_UI_UNLOCK_TODO,
    note: 'VIP markets gap until E4 Option B engine green',
  },
  {
    id: 'tier-keep-status-claim-blocked',
    route: '/tier/me',
    mitigatedBy: 'disabled+key',
    disabledReasonKey: TIER_KEEP_STATUS_UNAVAILABLE_REASON_KEY,
    engineTodo: TIER_KEEP_STATUS_ENGINE_TODO,
    note: '_repeatable_progress tier_keep_status fixed at 0 — claim blocked until E1',
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

/** E1 decay RPC ships before tier keep mission claim goes live. */
export function isTierKeepStatusClaimEngineLive(): boolean {
  return false;
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
