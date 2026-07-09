import { isGreaterThan, isPositive, money } from '@phonara/money';

export type SportsDebitBucketDisplayKey =
  | 'sports.slip.debit_bucket.bonus_only'
  | 'sports.slip.debit_bucket.bonus_then_real'
  | 'sports.slip.debit_bucket.real_only'
  | 'sports.slip.debit_bucket.usdt';

/** Display-only — which PHON track(s) the engine debits (bonus-first policy). E8 raw bonus from RPC. */
export function resolveSportsDebitBucketDisplayKey(input: {
  currency: 'PHON' | 'USDT';
  stake: string;
  phonBonusAvailable: string | null | undefined;
}): SportsDebitBucketDisplayKey {
  if (input.currency === 'USDT') {
    return 'sports.slip.debit_bucket.usdt';
  }

  const stakeRaw = input.stake.replace(/,/g, '').trim();
  const bonusRaw = input.phonBonusAvailable ?? '0';
  const bonus = money(bonusRaw, 'PHON');

  if (!stakeRaw || stakeRaw === '0' || !isPositive(money(stakeRaw, 'PHON'))) {
    if (isPositive(bonus)) {
      return 'sports.slip.debit_bucket.bonus_then_real';
    }
    return 'sports.slip.debit_bucket.real_only';
  }

  if (!isPositive(bonus)) {
    return 'sports.slip.debit_bucket.real_only';
  }

  const stakeMoney = money(stakeRaw, 'PHON');
  if (!isGreaterThan(stakeMoney, bonus)) {
    return 'sports.slip.debit_bucket.bonus_only';
  }

  return 'sports.slip.debit_bucket.bonus_then_real';
}
