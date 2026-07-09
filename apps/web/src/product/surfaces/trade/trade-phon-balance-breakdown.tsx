import type { MessageKey } from '@phonara/i18n';

import { MoneyDisplay } from '@/product/primitives/money-display';
import { cn } from '@/product/primitives/lib/cn';

export type TradePhonBalanceBreakdownProps = {
  phonBonusAvailableDisplay: string | null;
  phonRealAvailableDisplay: string | null;
  /** Aggregate PHON avail when breakdown is not yet loaded */
  phonAvail: string;
  t: (key: MessageKey) => string;
  className?: string;
  testId?: string;
};

/** Trade desk PHON bonus/real split — RPC `rpc_get_phon_balance_breakdown` display only. */
export function TradePhonBalanceBreakdown({
  phonBonusAvailableDisplay,
  phonRealAvailableDisplay,
  phonAvail,
  t,
  className,
  testId = 'trade-phon-balance-breakdown',
}: TradePhonBalanceBreakdownProps) {
  const showSplit = phonBonusAvailableDisplay != null && phonRealAvailableDisplay != null;

  if (!showSplit) {
    return (
      <div
        className={cn('flex items-baseline justify-between gap-2', className)}
        data-testid={testId}
      >
        <span className="text-foreground-muted text-xs">PHON</span>
        <MoneyDisplay
          amount={phonAvail}
          currency="PHON"
          showCurrency
          className="text-foreground text-sm font-medium"
        />
      </div>
    );
  }

  return (
    <div
      className={cn('border-line grid gap-2 rounded-(--ds-radius-md) border px-2 py-2', className)}
      data-testid={testId}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-foreground-muted text-xs">{t('wallet.phon.realLabel')}</span>
        <span data-testid="trade-phon-real-available">
          <MoneyDisplay
            amount={phonRealAvailableDisplay}
            currency="PHON"
            showCurrency
            className="text-foreground text-sm font-medium"
          />
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-foreground-muted text-xs">{t('wallet.phon.bonusLabel')}</span>
        <span data-testid="trade-phon-bonus-available">
          <MoneyDisplay
            amount={phonBonusAvailableDisplay}
            currency="PHON"
            showCurrency
            className="text-foreground text-sm font-medium"
          />
        </span>
      </div>
    </div>
  );
}
