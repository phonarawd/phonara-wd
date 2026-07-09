import { describe, expect, it } from 'vitest';

import {
  buildWithdrawTierLimitsView,
  earnVipWithdrawLimitLabelKey,
  nextEarnVipTier,
  normalizeEarnVipTier,
} from '../wallet-money-policy-display';

describe('wallet-money-policy-display §31.3', () => {
  it('normalizes earn VIP tier from RPC payload', () => {
    expect(normalizeEarnVipTier('Gold')).toBe('gold');
    expect(normalizeEarnVipTier('invalid')).toBeNull();
  });

  it('maps bronze to silver as next tier', () => {
    expect(nextEarnVipTier('bronze')).toBe('silver');
    expect(nextEarnVipTier('diamond')).toBeNull();
  });

  it('builds current and next withdraw limit label keys', () => {
    const view = buildWithdrawTierLimitsView('silver');
    expect(view.currentTier).toBe('silver');
    expect(view.currentLimitLabelKey).toBe(earnVipWithdrawLimitLabelKey('silver'));
    expect(view.nextTier).toBe('gold');
    expect(view.nextLimitLabelKey).toBe(earnVipWithdrawLimitLabelKey('gold'));
  });

  it('defaults unknown tier to bronze limits', () => {
    const view = buildWithdrawTierLimitsView(null);
    expect(view.currentTier).toBe('bronze');
    expect(view.nextTier).toBe('silver');
  });
});
