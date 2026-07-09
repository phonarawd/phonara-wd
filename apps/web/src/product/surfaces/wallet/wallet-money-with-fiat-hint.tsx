import type { FiatHintView } from '@/domain/fiat-reference-display-contract';
import { P4_PAGE_WALLET_FIAT_HINT_TODO } from '@/domain/fiat-reference-display-contract';
import { MoneyDisplay, type MoneyDisplayProps } from '@/product/primitives/money-display';
import { MoneyDisplayWithFiatHint } from '@/product/primitives/money-display-with-fiat-hint';

export type WalletMoneyWithFiatHintProps = MoneyDisplayProps & {
  fiatHint: FiatHintView;
};

/** Wallet/Ledger money row — primary settlement + optional secondary FiatHint (Fiat#6). */
export function WalletMoneyWithFiatHint({
  fiatHint,
  className,
  ...moneyProps
}: WalletMoneyWithFiatHintProps) {
  if (fiatHint.disabled) {
    return <MoneyDisplay {...moneyProps} className={className} />;
  }

  return (
    <span data-wallet-fiat-hint data-fiat-hint-todo={P4_PAGE_WALLET_FIAT_HINT_TODO}>
      <MoneyDisplayWithFiatHint
        {...moneyProps}
        fiatHint={fiatHint}
        hintLayout="secondary"
        className={className}
      />
    </span>
  );
}
