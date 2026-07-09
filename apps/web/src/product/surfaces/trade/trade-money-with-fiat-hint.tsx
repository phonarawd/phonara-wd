import type { FiatHintView } from '@/domain/fiat-reference-display-contract';
import { P9_TRADE_FIAT_HINT_WIRE_TODO } from '@/domain/fiat-reference-display-contract';
import type { TradeDeskFiatHintWireOptions } from '@/domain/trade-desk-fiat-hint-wire-display-contract';
import { useTradeFiatHint } from '@/features/trading/use-trade-fiat-hint';
import { isTradeFiatHintEligibleCurrency } from '@/features/trading/trade-fiat-hint-display';
import { MoneyDisplay, type MoneyDisplayProps } from '@/product/primitives/money-display';
import { MoneyDisplayWithFiatHint } from '@/product/primitives/money-display-with-fiat-hint';

export type TradeMoneyWithFiatHintProps = MoneyDisplayProps &
  TradeDeskFiatHintWireOptions & {
    /** Pre-built hint — omit to wire live rates from `useTradeFiatHint` (P2-E · Fiat#7). */
    fiatHint?: FiatHintView;
  };

/** Trade money row — primary USDT/PHON settlement + optional secondary FiatHint (Fiat#7). */
export function TradeMoneyWithFiatHint({
  fiatHint: fiatHintOverride,
  oracleStale,
  className,
  ...moneyProps
}: TradeMoneyWithFiatHintProps) {
  const { hintFor } = useTradeFiatHint();
  const currency = moneyProps.currency;
  const amount = String(moneyProps.amount ?? '');

  const fiatHint =
    fiatHintOverride ??
    (currency && isTradeFiatHintEligibleCurrency(currency)
      ? hintFor(amount, currency, { oracleStale })
      : null);

  if (!fiatHint || fiatHint.disabled) {
    return <MoneyDisplay {...moneyProps} className={className} />;
  }

  return (
    <span data-trade-fiat-hint data-fiat-hint-todo={P9_TRADE_FIAT_HINT_WIRE_TODO}>
      <MoneyDisplayWithFiatHint
        {...moneyProps}
        fiatHint={fiatHint}
        hintLayout="secondary"
        className={className}
      />
    </span>
  );
}
