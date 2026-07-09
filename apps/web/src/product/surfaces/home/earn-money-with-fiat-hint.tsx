import type { FiatHintView } from '@/domain/fiat-reference-display-contract';
import { P7_EARN_FIAT_HINT_CO_PRIMARY_TODO } from '@/domain/fiat-reference-display-contract';
import { FiatHintSecondaryLine } from '@/product/primitives/money-display-with-fiat-hint';
import { MoneyDisplay, type MoneyDisplayProps } from '@/product/primitives/money-display';
import { cn } from '@/product/primitives/lib/cn';

export type EarnMoneyWithFiatHintProps = MoneyDisplayProps & {
  fiatHint: FiatHintView;
};

/** Earn reward row — PHON primary + co-primary ≈fiat (Fiat#8 · side-income fiat co-primary). */
export function EarnMoneyWithFiatHint({
  fiatHint,
  className,
  ...moneyProps
}: EarnMoneyWithFiatHintProps) {
  if (fiatHint.disabled) {
    return (
      <MoneyDisplay
        {...moneyProps}
        className={cn('text-sm font-semibold text-accent', className)}
      />
    );
  }

  return (
    <span
      data-earn-fiat-hint
      data-fiat-hint-todo={P7_EARN_FIAT_HINT_CO_PRIMARY_TODO}
      className={cn('inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5', className)}
    >
      <MoneyDisplay {...moneyProps} className="text-sm font-semibold text-accent" />
      <FiatHintSecondaryLine fiatHint={fiatHint} hintLayout="co-primary" />
    </span>
  );
}
