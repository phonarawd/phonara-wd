import { describe, expect, it } from 'vitest';
import { resolveSportsDebitBucketDisplayKey } from '../sports-debit-bucket-display';

describe('resolveSportsDebitBucketDisplayKey', () => {
  it('USDT always maps to usdt track label', () => {
    expect(
      resolveSportsDebitBucketDisplayKey({
        currency: 'USDT',
        stake: '100',
        phonBonusAvailable: '500.000000',
      }),
    ).toBe('sports.slip.debit_bucket.usdt');
  });

  it('PHON with zero bonus → real only', () => {
    expect(
      resolveSportsDebitBucketDisplayKey({
        currency: 'PHON',
        stake: '50',
        phonBonusAvailable: '0.000000',
      }),
    ).toBe('sports.slip.debit_bucket.real_only');
  });

  it('PHON stake within bonus → bonus only', () => {
    expect(
      resolveSportsDebitBucketDisplayKey({
        currency: 'PHON',
        stake: '100',
        phonBonusAvailable: '500.000000',
      }),
    ).toBe('sports.slip.debit_bucket.bonus_only');
  });

  it('PHON stake exceeding bonus → bonus then real', () => {
    expect(
      resolveSportsDebitBucketDisplayKey({
        currency: 'PHON',
        stake: '600',
        phonBonusAvailable: '500.000000',
      }),
    ).toBe('sports.slip.debit_bucket.bonus_then_real');
  });
});
