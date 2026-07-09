import type { Currency } from '@phonara/shared-types';

import { isNegativeAmount, isPositiveAmount } from '@/lib/money-display';
import { useT } from '@/product/i18n';
import { resolveMoneyDisplayParts } from '@/product/primitives/lib/money-display-parts';
import { cn } from '@/product/primitives/lib/cn';

export interface MoneyDisplayProps {
  /** RPC decimal string — no client-side arithmetic (§25.2). */
  amount: string;
  currency: Currency;
  signed?: boolean;
  /** When true, currency suffix renders in a separate baseline-aligned span (§25.1-bis). */
  showCurrency?: boolean;
  size?: 'default' | 'hero';
  className?: string;
}

function signOf(amount: string): 'up' | 'down' | 'flat' {
  if (isPositiveAmount(amount)) return 'up';
  if (isNegativeAmount(amount)) return 'down';
  return 'flat';
}

/** Display-only money formatting via @phonara/money (§25.2 · §25.1-bis suffix grammar). */
export function MoneyDisplay({
  amount,
  currency,
  signed,
  showCurrency,
  size,
  className,
}: MoneyDisplayProps) {
  const t = useT();
  const { amountText, suffixKey } = resolveMoneyDisplayParts(amount, currency, {
    signed,
    showCurrency,
  });
  const sign = signed ? signOf(amount) : undefined;

  const amountClasses = cn(
    'tabular-nums',
    size === 'hero' && 'font-display text-(--ds-text-hero)',
    sign === 'up' && 'text-market-up',
    sign === 'down' && 'text-market-down',
  );

  const rootClasses = cn(className);

  if (!suffixKey) {
    return (
      <span data-sign={sign} data-money-display className={cn(amountClasses, rootClasses)}>
        {amountText}
      </span>
    );
  }

  return (
    <span data-sign={sign} data-money-display className={rootClasses}>
      <span className={cn('money-display__group', amountClasses)}>
        <span className="money-display__amount">{amountText}</span>
        <span className="money-display__suffix suffix">{t(suffixKey)}</span>
      </span>
    </span>
  );
}
