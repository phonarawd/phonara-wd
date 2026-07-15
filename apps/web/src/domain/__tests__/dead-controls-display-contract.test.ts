import { describe, expect, it } from 'vitest';

import {
  CASINO_HUB_DEFER_TODO,
  PQA_DEAD_CONTROL_DEFER_REGISTRY,
  REWARD_TICKETS_ISSUANCE_STATUS,
  SPORTS_VIP_ENGINE_TODO,
  SPORTS_VIP_UI_UNLOCK_TODO,
  TIER_KEEP_STATUS_ENGINE_TODO,
  assertPqaDeadControlRegistry,
  formatRewardTicketCount,
  isTierKeepStatusClaimEngineLive,
  isTierKeepStatusMission,
  resolveCasinoHubDeferReasonKey,
  resolveMissionUnavailableReason,
  resolveRewardTicketsIssuanceNoteKey,
  resolveSettingsApiKeysCreateDisabledReasonKey,
  resolveSportsVipDeferReasonKey,
  resolveTierKeepStatusUnavailableReason,
  shouldShowRewardTicketsIssuanceNote,
} from '../dead-controls-display-contract';
import { SETTINGS_API_KEYS_ENGINE_TODO } from '../settings-api-keys-display-contract';

describe('dead-controls-display-contract (PQA F3)', () => {
  it('registers P3 defer stubs with disabled+key or defer_stub mitigation', () => {
    assertPqaDeadControlRegistry();
    expect(PQA_DEAD_CONTROL_DEFER_REGISTRY.length).toBeGreaterThanOrEqual(5);
    const ids = PQA_DEAD_CONTROL_DEFER_REGISTRY.map((row) => row.id);
    expect(ids).toContain('casino-route-hub-stub');
    expect(ids).toContain('casino-round-hook-orphan');
    expect(ids).toContain('settings-api-keys-stub');
    expect(ids).toContain('sports-vip-coming-soon');
    expect(ids).toContain('tier-keep-status-claim-blocked');
    expect(ids).toContain('user-reward-tickets-zero-issuance');

    const hub = PQA_DEAD_CONTROL_DEFER_REGISTRY.find((row) => row.id === 'casino-route-hub-stub');
    expect(hub?.mitigatedBy).toBe('live');
    expect(hub?.engineTodo).toBe('p10-page-casino');

    const apiKeys = PQA_DEAD_CONTROL_DEFER_REGISTRY.find(
      (row) => row.id === 'settings-api-keys-stub',
    );
    expect(apiKeys?.mitigatedBy).toBe('live');
    expect(apiKeys?.engineTodo).toBe(SETTINGS_API_KEYS_ENGINE_TODO);

    const roundHook = PQA_DEAD_CONTROL_DEFER_REGISTRY.find(
      (row) => row.id === 'casino-round-hook-orphan',
    );
    expect(roundHook?.mitigatedBy).toBe('live');
    expect(roundHook?.engineTodo).toBe('p10-casino-replay-and-infra');
  });

  it('enables tier-keepStatus claim after E1 engine ships', () => {
    expect(isTierKeepStatusMission('tier-keepStatus')).toBe(true);
    expect(isTierKeepStatusClaimEngineLive()).toBe(true);
    expect(resolveTierKeepStatusUnavailableReason('tier-keepStatus')).toBeNull();
    expect(resolveTierKeepStatusUnavailableReason('viral-shareLink')).toBeNull();
    expect(
      resolveMissionUnavailableReason({ authenticated: true, uiId: 'tier-keepStatus' }),
    ).toBeNull();
  });

  it('wires defer reason keys to engine todo ids', () => {
    expect(resolveCasinoHubDeferReasonKey()).toBe('casino.hub.defer.body');
    expect(resolveSportsVipDeferReasonKey()).toBe('sports.vip.defer.body');
    expect(resolveSettingsApiKeysCreateDisabledReasonKey()).toBe(
      'settings.apiKeys.create.disabledHint',
    );
    expect(resolveRewardTicketsIssuanceNoteKey()).toBe('earn.home.tickets.issuanceNote');
    expect(TIER_KEEP_STATUS_ENGINE_TODO).toBe('ew-e1-decay-wave');
    expect(CASINO_HUB_DEFER_TODO).toBe('p10-casino-replay-and-infra');
    expect(SPORTS_VIP_ENGINE_TODO).toBe('ew-e4-gate-tier-option-b');
    expect(SPORTS_VIP_UI_UNLOCK_TODO).toBe('ew-e5-gap-surfaces-wire');
    expect(SETTINGS_API_KEYS_ENGINE_TODO).toBe('ew-e8-financial-wave');
    expect(REWARD_TICKETS_ISSUANCE_STATUS).toBe('read_only_no_grant_rpc');
  });

  it('formats reward ticket counts honestly at zero', () => {
    expect(formatRewardTicketCount(0)).toBe('0');
    expect(formatRewardTicketCount(3)).toBe('3');
    expect(shouldShowRewardTicketsIssuanceNote()).toBe(true);
  });
});
