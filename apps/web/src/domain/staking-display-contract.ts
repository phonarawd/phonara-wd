/**
 * `/staking` hub — pool catalog (majors + PHON) · tier APY bonus presentation (partial) · position display.
 * ENGINE:exists — `staking_pools` read · `rpc_stake` · `rpc_stake_phon` · `rpc_unstake_phon` · `rpc_claim_staking_reward`.
 * Tier APY bonus = presentation-only i18n until E4 tier-cap engine ships.
 */

import type { MessageKey } from '@phonara/i18n';

import { ratePercent } from '@/lib/money-display';
import type { StakingPool, StakingPosition } from '@/hooks/use-trading';

import { normalizeEarnVipTier, type EarnVipTier } from './unified-tier-display-contract';

function isStakingPositionLocked(position: StakingPosition): boolean {
  if (!position.unlock_at) return false;
  return new Date(position.unlock_at) > new Date();
}

function stakingPositionStatusKey(position: StakingPosition): MessageKey {
  return isStakingPositionLocked(position)
    ? 'staking.position.status.locked'
    : 'staking.position.status.active';
}

export const STAKING_HUB_ROUTE = '/staking' as const;
export const STAKING_POSITIONS_ROUTE = '/staking/positions' as const;

export type StakingStakeCurrency = 'USDT' | 'PHON';

export const STAKING_TERM_LABEL_KEYS: Record<string, MessageKey> = {
  flexible: 'staking.term.flexible',
  days_7: 'staking.term.days_7',
  days_30: 'staking.term.days_30',
  days_90: 'staking.term.days_90',
  custom: 'staking.term.custom',
};

/** Presentation-only tier APY bonus labels — not added to pool APR client-side. */
export const STAKING_TIER_APY_BONUS_KEYS: Record<EarnVipTier, MessageKey> = {
  bronze: 'staking.tierApyBonus.bronze',
  silver: 'staking.tierApyBonus.silver',
  gold: 'staking.tierApyBonus.gold',
  platinum: 'staking.tierApyBonus.platinum',
  diamond: 'staking.tierApyBonus.diamond',
  prime_elite: 'staking.tierApyBonus.prime_elite',
};

export type StakingPoolCardView = {
  id: string;
  referenceAsset: string;
  stakeCurrency: StakingStakeCurrency;
  displayName: string;
  term: string;
  termLabelKey: MessageKey;
  lockDays: number;
  baseAprDisplay: string;
  tierApyBonusKey: MessageKey;
};

export type StakingPositionRowView = {
  id: string;
  referenceAsset: string;
  stakeCurrency: StakingStakeCurrency;
  poolLabel: string;
  termLabelKey: MessageKey;
  principalDisplay: string;
  rewardClaimedDisplay: string;
  /** Engine-exposed pending reward; null until claimable RPC/view ships (P1-C stage 2). */
  pendingRewardDisplay: string | null;
  aprSnapshotDisplay: string;
  statusKey: MessageKey;
  locked: boolean;
  unlockAt: string | null;
};

function readStakingPendingRewardDisplay(position: StakingPosition): string | null {
  const raw = (position as StakingPosition & { pending_reward?: string | null }).pending_reward;
  if (raw === undefined || raw === null) return null;
  if (raw.trim() === '') return null;
  return raw;
}

function normalizeStakingMoneyDisplay(raw: string | null | undefined): string {
  if (raw == null || raw.trim() === '') return '0';
  return raw;
}

export function resolveStakingTermLabelKey(term: string): MessageKey {
  return STAKING_TERM_LABEL_KEYS[term] ?? 'staking.term.custom';
}

export function resolveStakingTierApyBonusKey(tier: EarnVipTier): MessageKey {
  return STAKING_TIER_APY_BONUS_KEYS[tier];
}

export function formatStakingAprDisplay(apr: string): string {
  return `${ratePercent(apr, 1)}%`;
}

export function resolveStakingPoolDisplayName(pool: StakingPool): string {
  if (pool.display_name) return pool.display_name;
  return `${pool.reference_asset} · ${pool.stake_currency}`;
}

/** PHON-native pools only — legacy filter for rpc_stake_phon-only glue. */
export function filterPhonStakingPools(pools: readonly StakingPool[]): StakingPool[] {
  return pools.filter((pool) => pool.stake_currency === 'PHON' && pool.reference_asset === 'PHON');
}

export function listStakingReferenceAssets(pools: readonly StakingPool[]): string[] {
  const refs = new Set(pools.map((pool) => pool.reference_asset));
  return [...refs].sort((a, b) => {
    if (a === 'PHON') return -1;
    if (b === 'PHON') return 1;
    return a.localeCompare(b);
  });
}

export function filterStakingPoolsByAssetAndCurrency(
  pools: readonly StakingPool[],
  referenceAsset: string,
  stakeCurrency: StakingStakeCurrency,
): StakingPool[] {
  return pools
    .filter(
      (pool) => pool.reference_asset === referenceAsset && pool.stake_currency === stakeCurrency,
    )
    .sort((a, b) => a.lock_days - b.lock_days || a.sort_order - b.sort_order);
}

export function buildStakingPoolCardView(
  pool: StakingPool,
  tier: EarnVipTier,
): StakingPoolCardView {
  return {
    id: pool.id,
    referenceAsset: pool.reference_asset,
    stakeCurrency: pool.stake_currency as StakingStakeCurrency,
    displayName: resolveStakingPoolDisplayName(pool),
    term: pool.term,
    termLabelKey: resolveStakingTermLabelKey(pool.term),
    lockDays: pool.lock_days,
    baseAprDisplay: formatStakingAprDisplay(pool.estimated_apr),
    tierApyBonusKey: resolveStakingTierApyBonusKey(tier),
  };
}

export function resolveStakingPositionCurrency(position: StakingPosition): StakingStakeCurrency {
  const currency = position.stake_currency ?? 'PHON';
  return currency === 'USDT' ? 'USDT' : 'PHON';
}

export function resolveStakingPositionReferenceAsset(position: StakingPosition): string {
  return position.reference_asset ?? 'PHON';
}

export function resolveStakingPositionPoolLabel(position: StakingPosition): string {
  const ref = resolveStakingPositionReferenceAsset(position);
  const currency = resolveStakingPositionCurrency(position);
  return `${ref} · ${currency}`;
}

export function mapStakingPositionRow(position: StakingPosition): StakingPositionRowView {
  return {
    id: position.id,
    referenceAsset: resolveStakingPositionReferenceAsset(position),
    stakeCurrency: resolveStakingPositionCurrency(position),
    poolLabel: resolveStakingPositionPoolLabel(position),
    termLabelKey: resolveStakingTermLabelKey(position.term),
    principalDisplay: normalizeStakingMoneyDisplay(position.principal),
    rewardClaimedDisplay: normalizeStakingMoneyDisplay(position.reward_claimed),
    pendingRewardDisplay: readStakingPendingRewardDisplay(position),
    aprSnapshotDisplay: formatStakingAprDisplay(position.apr_snapshot),
    statusKey: stakingPositionStatusKey(position),
    locked: isStakingPositionLocked(position),
    unlockAt: position.unlock_at,
  };
}

export function listActiveStakingPositions(
  positions: readonly StakingPosition[],
): StakingPosition[] {
  return positions.filter((position) => position.status === 'active');
}

export function listUnstakedStakingPositions(
  positions: readonly StakingPosition[],
): StakingPosition[] {
  return positions.filter((position) => position.status === 'unstaked');
}

export function normalizeStakingTier(tier: string | null | undefined): EarnVipTier {
  return normalizeEarnVipTier(tier);
}

/** Staking hub stake flow — pool → amount → confirm (Phase 2 P2-3). */
export type StakingWizardStep = 'pool' | 'amount' | 'confirm';

export const STAKING_WIZARD_STEPS: readonly StakingWizardStep[] = ['pool', 'amount', 'confirm'];

export const STAKING_WIZARD_STEP_LABEL_KEYS: Record<StakingWizardStep, MessageKey> = {
  pool: 'staking.wizard.stepPool',
  amount: 'staking.wizard.stepAmount',
  confirm: 'staking.wizard.stepConfirm',
};

export function resolveStakingWizardStepIndex(step: StakingWizardStep): number {
  return STAKING_WIZARD_STEPS.indexOf(step);
}

export function resolveNextStakingWizardStep(step: StakingWizardStep): StakingWizardStep | null {
  const index = resolveStakingWizardStepIndex(step);
  return STAKING_WIZARD_STEPS[index + 1] ?? null;
}

export function resolvePreviousStakingWizardStep(
  step: StakingWizardStep,
): StakingWizardStep | null {
  const index = resolveStakingWizardStepIndex(step);
  return index > 0 ? (STAKING_WIZARD_STEPS[index - 1] ?? null) : null;
}
