import { isEarnRewardPhonHintEligible } from '@/features/earn/earn-fiat-hint-display';
import type { EarnFiatHintView } from '@/features/earn/use-earn-fiat-hint';
import { cn } from '@/product/primitives/lib/cn';

import { EarnMoneyWithFiatHint } from './earn-money-with-fiat-hint';

export type EarnMissionRewardProps = {
  rewardPhon?: string | null;
  rewardLabel: string;
  earnFiat: EarnFiatHintView;
  className?: string;
};

/** Mission/referral/tier card reward — RPC PHON + co-primary fiat hint (Fiat#8). */
export function EarnMissionReward({
  rewardPhon,
  rewardLabel,
  earnFiat,
  className,
}: EarnMissionRewardProps) {
  if (isEarnRewardPhonHintEligible(rewardPhon)) {
    return (
      <EarnMoneyWithFiatHint
        amount={rewardPhon}
        currency="PHON"
        signed
        showCurrency
        fiatHint={earnFiat.hintFor(rewardPhon, 'PHON')}
        className={className}
      />
    );
  }

  if (rewardLabel === '—') return null;

  return (
    <span className={cn('text-accent text-sm font-semibold tabular-nums', className)}>
      {rewardLabel}
    </span>
  );
}
