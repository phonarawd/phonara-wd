import type { MessageKey } from '@phonara/i18n';

import { TradeHelpTip } from '@/features/trading/trade-beginner-help/trade-help-tip';
import { useT } from '@/product/i18n';
import { Button } from '@/product/primitives/button';
import { cn } from '@/product/primitives/lib/cn';

export type SpendCurrency = 'USDT' | 'PHON';

const SPEND_CURRENCIES: readonly SpendCurrency[] = ['USDT', 'PHON'];

export type SpendCurrencySelectorProps = {
  value: SpendCurrency;
  onChange: (currency: SpendCurrency) => void;
  disabled?: boolean;
  /** Container `data-testid` */
  testId?: string;
  /** Per-currency button ids: `${prefix}-usdt` / `${prefix}-phon` */
  currencyTestIdPrefix?: string;
  showHelpTip?: boolean;
  className?: string;
  disabledCurrencies?: Partial<Record<SpendCurrency, boolean>>;
  /** Override aria-label; defaults to `common.spendCurrency` */
  ariaLabel?: MessageKey;
};

export function SpendCurrencySelector({
  value,
  onChange,
  disabled = false,
  testId,
  currencyTestIdPrefix = 'spend-currency',
  showHelpTip = false,
  className,
  disabledCurrencies,
  ariaLabel = 'common.spendCurrency',
}: SpendCurrencySelectorProps) {
  const t = useT();

  return (
    <div
      className={cn('grid grid-cols-2 gap-2', className)}
      data-testid={testId}
      role="group"
      aria-label={t(ariaLabel)}
    >
      {showHelpTip ? (
        <div className="col-span-2 mb-1 flex items-center gap-1">
          <span className="text-foreground-muted text-xs">{t('common.spendCurrency')}</span>
          <TradeHelpTip termId="stake_currency" className="text-xs" />
        </div>
      ) : (
        <p className="text-foreground-muted col-span-2 m-0 text-xs">{t('common.spendCurrency')}</p>
      )}
      {SPEND_CURRENCIES.map((currency) => {
        const currencyDisabled = disabled || disabledCurrencies?.[currency] === true;
        return (
          <Button
            key={currency}
            type="button"
            size="sm"
            variant={value === currency ? 'primary' : 'outline'}
            data-testid={`${currencyTestIdPrefix}-${currency.toLowerCase()}`}
            aria-pressed={value === currency}
            disabled={currencyDisabled}
            onClick={() => onChange(currency)}
          >
            {currency}
          </Button>
        );
      })}
    </div>
  );
}
