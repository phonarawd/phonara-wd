import { describe, expect, it } from 'vitest';

import {
  PLATFORM_FEATURE_FLAG_FIVE_CONDITIONS,
  PLATFORM_R10_ROLLBACK_TRIGGERS,
  PLATFORM_R10_ROLLOUT_STAGES,
  PLATFORM_R10_SOAK_CHECKPOINTS,
  assertPlatformR10RolloutSync,
  findPlatformR10RolloutStage,
  platformR10FlipStages,
} from '../platform-r10-rollout-display-contract';

describe('platform-r10-rollout-display-contract', () => {
  it('registers five conditions, six stages, four checkpoints, six triggers', () => {
    assertPlatformR10RolloutSync();
    expect(PLATFORM_FEATURE_FLAG_FIVE_CONDITIONS).toHaveLength(5);
    expect(PLATFORM_R10_ROLLOUT_STAGES).toHaveLength(6);
    expect(PLATFORM_R10_SOAK_CHECKPOINTS).toHaveLength(4);
    expect(PLATFORM_R10_ROLLBACK_TRIGGERS).toHaveLength(6);
  });

  it('orders rollout stages Live Crash → Withdrawal after baseline', () => {
    const flip = platformR10FlipStages().map((s) => s.id);
    expect(flip).toEqual(['live-crash', 'trade', 'sports', 'giftcard', 'withdrawal']);
    expect(findPlatformR10RolloutStage('baseline-soak')?.flipAllowed).toBe(false);
    expect(findPlatformR10RolloutStage('withdrawal')?.featureKeys).toContain(
      'feature_withdrawal_enabled',
    );
  });

  it('maps rollback triggers to dry-fire keys 1:1', () => {
    for (const row of PLATFORM_R10_ROLLBACK_TRIGGERS) {
      expect(row.alertDryFireKey).toBe(row.key);
    }
  });
});
