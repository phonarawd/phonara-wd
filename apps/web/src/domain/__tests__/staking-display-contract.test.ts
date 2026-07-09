import { describe, expect, it } from 'vitest';

import type { StakingPool, StakingPosition } from '@/hooks/use-trading';

import {
  buildStakingPoolCardView,
  filterPhonStakingPools,
  filterStakingPoolsByAssetAndCurrency,
  formatStakingAprDisplay,
  listActiveStakingPositions,
  listStakingReferenceAssets,
  listUnstakedStakingPositions,
  mapStakingPositionRow,
  resolveStakingPoolDisplayName,
  resolveStakingTermLabelKey,
  resolveStakingTierApyBonusKey,
  resolveNextStakingWizardStep,
  resolvePreviousStakingWizardStep,
  STAKING_WIZARD_STEPS,
} from '../staking-display-contract';

function pool(overrides: Partial<StakingPool> = {}): StakingPool {
  return {
    id: 'pool-1',
    display_name: null,
    stake_currency: 'PHON',
    reward_currency: 'PHON',
    reference_asset: 'PHON',
    term: 'days_30',
    lock_days: 30,
    estimated_apr: '0.12',
    is_active: true,
    sort_order: 1,
    created_at: '2026-07-05T00:00:00.000Z',
    ...overrides,
  };
}

function position(overrides: Partial<StakingPosition> = {}): StakingPosition {
  return {
    id: 'pos-1',
    user_id: 'user-1',
    pool_id: 'pool-1',
    principal: '1000.000000',
    apr_snapshot: '0.12',
    term: 'days_30',
    lock_days: 30,
    status: 'active',
    reward_claimed: '0.000000',
    stake_currency: 'PHON',
    reference_asset: 'PHON',
    staked_at: '2026-07-01T00:00:00.000Z',
    unlock_at: '2026-07-31T00:00:00.000Z',
    unstaked_at: null,
    updated_at: '2026-07-05T00:00:00.000Z',
    ...overrides,
  };
}

describe('staking-display-contract', () => {
  it('formats APR from RPC decimal without float math', () => {
    expect(formatStakingAprDisplay('0.12')).toBe('12.0%');
    expect(formatStakingAprDisplay('0.03')).toBe('3.0%');
  });

  it('filters PHON-native pools for legacy rpc_stake_phon glue', () => {
    const pools = [
      pool(),
      pool({ id: 'pool-usdt', stake_currency: 'USDT', reference_asset: 'BTC' }),
    ];
    expect(filterPhonStakingPools(pools)).toHaveLength(1);
    expect(filterPhonStakingPools(pools)[0]?.id).toBe('pool-1');
  });

  it('lists reference assets with PHON first', () => {
    const assets = listStakingReferenceAssets([
      pool({ reference_asset: 'ETH' }),
      pool({ id: 'p2', reference_asset: 'BTC' }),
      pool({ id: 'p3', reference_asset: 'PHON' }),
    ]);
    expect(assets).toEqual(['PHON', 'BTC', 'ETH']);
  });

  it('filters pools by reference asset and stake currency', () => {
    const pools = [
      pool({ id: 'btc-usdt', reference_asset: 'BTC', stake_currency: 'USDT', term: 'flexible' }),
      pool({ id: 'btc-phon', reference_asset: 'BTC', stake_currency: 'PHON', term: 'flexible' }),
      pool({ id: 'eth-usdt', reference_asset: 'ETH', stake_currency: 'USDT', term: 'flexible' }),
    ];
    const filtered = filterStakingPoolsByAssetAndCurrency(pools, 'BTC', 'USDT');
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe('btc-usdt');
  });

  it('builds pool cards with reference asset and tier bonus keys', () => {
    const card = buildStakingPoolCardView(
      pool({ reference_asset: 'BTC', stake_currency: 'USDT', display_name: 'BTC · USDT 30D' }),
      'gold',
    );
    expect(card.referenceAsset).toBe('BTC');
    expect(card.stakeCurrency).toBe('USDT');
    expect(card.displayName).toBe('BTC · USDT 30D');
    expect(card.termLabelKey).toBe('staking.term.days_30');
    expect(card.baseAprDisplay).toBe('12.0%');
    expect(card.tierApyBonusKey).toBe('staking.tierApyBonus.gold');
  });

  it('resolves pool display name fallback', () => {
    expect(resolveStakingPoolDisplayName(pool())).toBe('PHON · PHON');
    expect(resolveStakingPoolDisplayName(pool({ display_name: 'Custom label' }))).toBe(
      'Custom label',
    );
  });

  it('maps active positions with majors currency columns', () => {
    const row = mapStakingPositionRow(position({ reference_asset: 'BTC', stake_currency: 'USDT' }));
    expect(row.poolLabel).toBe('BTC · USDT');
    expect(row.stakeCurrency).toBe('USDT');
    expect(row.termLabelKey).toBe('staking.term.days_30');
    expect(row.statusKey).toBe('staking.position.status.locked');
    expect(row.locked).toBe(true);

    const active = listActiveStakingPositions([
      position(),
      position({ id: 'pos-2', status: 'unstaked' }),
    ]);
    expect(active).toHaveLength(1);
    expect(active[0]?.id).toBe('pos-1');
  });

  it('lists unstaked positions for history tab', () => {
    const unstaked = listUnstakedStakingPositions([
      position(),
      position({ id: 'pos-2', status: 'unstaked' }),
    ]);
    expect(unstaked).toHaveLength(1);
    expect(unstaked[0]?.id).toBe('pos-2');
  });

  it('resolves term and tier bonus keys', () => {
    expect(resolveStakingTermLabelKey('flexible')).toBe('staking.term.flexible');
    expect(resolveStakingTermLabelKey('unknown')).toBe('staking.term.custom');
    expect(resolveStakingTierApyBonusKey('diamond')).toBe('staking.tierApyBonus.diamond');
  });

  it('documents staking wizard step order (P2-3)', () => {
    expect(STAKING_WIZARD_STEPS).toEqual(['pool', 'amount', 'confirm']);
    expect(resolveNextStakingWizardStep('pool')).toBe('amount');
    expect(resolveNextStakingWizardStep('amount')).toBe('confirm');
    expect(resolvePreviousStakingWizardStep('confirm')).toBe('amount');
  });
});
