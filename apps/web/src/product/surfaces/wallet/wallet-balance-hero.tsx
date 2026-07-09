import type { FiatHintView } from '@/domain/fiat-reference-display-contract';
import { P4_PAGE_WALLET_FIAT_HINT_TODO } from '@/domain/fiat-reference-display-contract';
import { MoneyDisplay } from '@/product/primitives/money-display';
import { MoneyDisplayWithFiatHint } from '@/product/primitives/money-display-with-fiat-hint';
import { cn } from '@/product/primitives/lib/cn';

export interface WalletBalanceHeroProps {
  label: string;
  amount: string;
  fiatHint?: FiatHintView;
  className?: string;
}

/** §25.1-bis hero balance — MoneyDisplay size=hero · RPC decimal string only · optional FiatHint (Fiat#6). */
export function WalletBalanceHero({ label, amount, fiatHint, className }: WalletBalanceHeroProps) {
  const moneyClassName = 'text-accent mt-2 block';

  return (
    <section
      className={cn(
        'border-line bg-surface-raised rounded-(--ds-radius-lg) border p-5 md:p-6',
        className,
      )}
      data-testid="wallet-balance-hero"
      data-fiat-hint-todo={P4_PAGE_WALLET_FIAT_HINT_TODO}
      aria-label={label}
    >
      <p className="text-foreground-muted m-0 text-sm font-medium">{label}</p>
      {fiatHint && !fiatHint.disabled ? (
        <MoneyDisplayWithFiatHint
          amount={amount}
          currency="PHON"
          size="hero"
          showCurrency
          fiatHint={fiatHint}
          hintLayout="secondary"
          className={moneyClassName}
        />
      ) : (
        <MoneyDisplay
          amount={amount}
          currency="PHON"
          size="hero"
          showCurrency
          className={moneyClassName}
        />
      )}
    </section>
  );
}
