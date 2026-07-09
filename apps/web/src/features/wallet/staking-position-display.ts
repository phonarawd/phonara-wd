import type { MessageKey } from '@phonara/i18n';
import type { StakingPosition } from '../../hooks/use-trading';

/** True when unlock_at is set and still in the future (display-only — server enforces unstake). */
export function isStakingPositionLocked(position: StakingPosition): boolean {
  if (!position.unlock_at) return false;
  return new Date(position.unlock_at) > new Date();
}

export function stakingPositionStatusKey(position: StakingPosition): MessageKey {
  return isStakingPositionLocked(position)
    ? 'staking.position.status.locked'
    : 'staking.position.status.active';
}
