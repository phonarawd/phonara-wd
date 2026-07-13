import type { FiatHintView } from '@/domain/fiat-reference-display-contract';
import { P10_CASINO_FIAT_HINT_SESSION_LOCK_TODO } from '@/domain/fiat-reference-display-contract';
import type { CasinoFiatHintWireRole } from '@/domain/casino-fiat-hint-session-lock-display-contract';
import { useCasinoFiatHint } from '@/features/casino/use-casino-fiat-hint';
import { isCasinoFiatHintEligibleCurrency } from '@/features/casino/casino-fiat-hint-display';
import { MoneyDisplay, type MoneyDisplayProps } from '@/product/primitives/money-display';
import { MoneyDisplayWithFiatHint } from '@/product/primitives/money-display-with-fiat-hint';

export type CasinoMoneyWithFiatHintProps = MoneyDisplayProps & {
  /** Pre-built hint — omit to wire live/session rates from `useCasinoFiatHint` (Fiat#11). */
  fiatHint?: FiatHintView;
  /** Stake before/during bet; win after RPC settle payout. */
  role?: CasinoFiatHintWireRole;
};

/** Casino money row — primary USDT/PHON settlement + optional secondary FiatHint (Fiat#11). */
export function CasinoMoneyWithFiatHint({
  fiatHint: fiatHintOverride,
  role = 'stake',
  className,
  ...moneyProps
}: CasinoMoneyWithFiatHintProps) {
  const { hintFor, sessionLocked } = useCasinoFiatHint();
  const currency = moneyProps.currency;
  const amount = String(moneyProps.amount ?? '');

  const fiatHint =
    fiatHintOverride ??
    (currency && isCasinoFiatHintEligibleCurrency(currency) ? hintFor(amount, currency) : null);

  if (!fiatHint || fiatHint.disabled) {
    return <MoneyDisplay {...moneyProps} className={className} />;
  }

  return (
    <span
      data-casino-fiat-hint
      data-casino-fiat-hint-role={role}
      data-casino-fiat-session-locked={sessionLocked ? 'true' : 'false'}
      data-fiat-hint-todo={P10_CASINO_FIAT_HINT_SESSION_LOCK_TODO}
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
