import type { Currency } from '@phonara/shared-types';

import { useT } from '@/product/i18n';
import { Button } from '@/product/primitives/button';
import { cn } from '@/product/primitives/lib/cn';
import { MoneyDisplay } from '@/product/primitives/money-display';

export interface ZeroBalanceStateProps {
  currency: Currency;
  onDeposit: () => void;
  className?: string;
}

/** §25.15 — hero-sized zero balance (no shrink) + single deposit CTA. */
export function ZeroBalanceState({ currency, onDeposit, className }: ZeroBalanceStateProps) {
  const t = useT();

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-(--ds-radius-lg) border border-line',
        'bg-surface px-6 py-10 text-center',
        className,
      )}
    >
      <p className="text-sm text-foreground-muted">{t('home.wallet.balanceLabel')}</p>
      <div className="text-foreground-muted">
        <MoneyDisplay amount="0" currency={currency} size="hero" />
      </div>
      <Button variant="primary" size="md" onClick={onDeposit}>
        {t('wallet.cta.depositKrw')}
      </Button>
    </div>
  );
}
