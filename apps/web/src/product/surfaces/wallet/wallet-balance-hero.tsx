import type { ReactNode } from 'react';

import type { FiatHintView } from '@/domain/fiat-reference-display-contract';
import { P4_PAGE_WALLET_FIAT_HINT_TODO } from '@/domain/fiat-reference-display-contract';
import { Card, CardBody } from '@/product/primitives/card';
import { CollapsibleSection } from '@/product/primitives/collapsible-section';
import { MoneyDisplay } from '@/product/primitives/money-display';
import { MoneyDisplayWithFiatHint } from '@/product/primitives/money-display-with-fiat-hint';
import { cn } from '@/product/primitives/lib/cn';

export interface WalletBalanceHeroProps {
  label: string;
  amount: string;
  fiatHint?: FiatHintView;
  /** Locked / real / bonus breakdown — accordion body (§34.13). */
  detailsTitle: string;
  detailsSummary?: ReactNode;
  expandLabel?: string;
  collapseLabel?: string;
  details?: ReactNode;
  className?: string;
}

/** §25.1-bis · §34.13 wallet-hero Card + CollapsibleSection breakdown. */
export function WalletBalanceHero({
  label,
  amount,
  fiatHint,
  detailsTitle,
  detailsSummary,
  expandLabel,
  collapseLabel,
  details,
  className,
}: WalletBalanceHeroProps) {
  const moneyClassName = 'text-accent mt-2 block';

  return (
    <Card
      variant="wallet-hero"
      className={cn('overflow-hidden', className)}
      data-testid="wallet-balance-hero"
      data-fiat-hint-todo={P4_PAGE_WALLET_FIAT_HINT_TODO}
      data-signature="living-balance"
      aria-label={label}
    >
      <CardBody className="pb-2">
        <p className="text-foreground-muted m-0 text-sm font-medium">{label}</p>
        {fiatHint && !fiatHint.disabled ? (
          <MoneyDisplayWithFiatHint
            amount={amount}
            currency="PHON"
            size="hero"
            showCurrency
            countUp
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
            countUp
            className={moneyClassName}
          />
        )}
      </CardBody>

      {details ? (
        <CollapsibleSection
          title={detailsTitle}
          defaultOpen={false}
          summary={detailsSummary}
          expandLabel={expandLabel}
          collapseLabel={collapseLabel}
          variant="plain"
          className="border-line border-t px-4 pb-3"
          testId="wallet-hero-details"
        >
          {details}
        </CollapsibleSection>
      ) : null}
    </Card>
  );
}
