import type { FiatHintView } from '@/domain/fiat-reference-display-contract';
import { P10_SPORTS_FIAT_HINT_WIRE_TODO } from '@/domain/fiat-reference-display-contract';
import type { SportsFiatHintWireRole } from '@/domain/sports-fiat-hint-wire-display-contract';
import { useSportsFiatHint } from '@/features/sports/use-sports-fiat-hint';
import { isSportsFiatHintEligibleCurrency } from '@/features/sports/sports-fiat-hint-display';
import { MoneyDisplay, type MoneyDisplayProps } from '@/product/primitives/money-display';
import { MoneyDisplayWithFiatHint } from '@/product/primitives/money-display-with-fiat-hint';

export type SportsMoneyWithFiatHintProps = MoneyDisplayProps & {
  /** Pre-built hint — omit to wire live rates from `useSportsFiatHint` (Fiat#10). */
  fiatHint?: FiatHintView;
  /** Stake hints anytime; potential_return requires preview amount (odds-after). */
  role?: SportsFiatHintWireRole;
};

/** Sports slip money row — primary USDT/PHON settlement + optional secondary FiatHint (Fiat#10). */
export function SportsMoneyWithFiatHint({
  fiatHint: fiatHintOverride,
  role = 'stake',
  className,
  ...moneyProps
}: SportsMoneyWithFiatHintProps) {
  const { hintFor } = useSportsFiatHint();
  const currency = moneyProps.currency;
  const amount = String(moneyProps.amount ?? '');

  const fiatHint =
    fiatHintOverride ??
    (currency && isSportsFiatHintEligibleCurrency(currency)
      ? hintFor(amount, currency, {
          requirePotentialReturn: role === 'potential_return',
        })
      : null);

  if (!fiatHint || fiatHint.disabled) {
    return <MoneyDisplay {...moneyProps} className={className} />;
  }

  return (
    <span
      data-sports-fiat-hint
      data-sports-fiat-hint-role={role}
      data-fiat-hint-todo={P10_SPORTS_FIAT_HINT_WIRE_TODO}
    >
      <MoneyDisplayWithFiatHint
        {...moneyProps}
        fiatHint={fiatHint}
        hintLayout="secondary"
        className={className}
      />
    </span>
  );
}
