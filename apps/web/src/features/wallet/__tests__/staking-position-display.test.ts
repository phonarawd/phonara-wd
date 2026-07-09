import { describe, expect, it } from 'vitest';
import { isStakingPositionLocked, stakingPositionStatusKey } from '../staking-position-display';
import type { StakingPosition } from '../../../hooks/use-trading';

function position(overrides: Partial<StakingPosition> = {}): StakingPosition {
  return {
    id: 'pos-1',
    term: 'days_30',
    principal: '1000.000000',
    reward_claimed: '0.000000',
    status: 'active',
    unlock_at: null,
    apr_snapshot: '10',
    lock_days: 30,
    pool_id: 'pool-1',
    staked_at: '2026-01-01T00:00:00.000Z',
    unstaked_at: null,
    updated_at: '2026-01-01T00:00:00.000Z',
    user_id: 'user-1',
    ...overrides,
  } as StakingPosition;
}

describe('staking-position-display', () => {
  it('marks future unlock_at as locked', () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(isStakingPositionLocked(position({ unlock_at: future }))).toBe(true);
    expect(stakingPositionStatusKey(position({ unlock_at: future }))).toBe(
      'staking.position.status.locked',
    );
  });

  it('marks past or missing unlock_at as active', () => {
    const past = new Date(Date.now() - 86_400_000).toISOString();
    expect(isStakingPositionLocked(position({ unlock_at: past }))).toBe(false);
    expect(isStakingPositionLocked(position({ unlock_at: null }))).toBe(false);
    expect(stakingPositionStatusKey(position({ unlock_at: null }))).toBe(
      'staking.position.status.active',
    );
  });
});
