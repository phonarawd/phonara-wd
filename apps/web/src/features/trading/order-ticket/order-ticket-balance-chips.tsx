import {
  BALANCE_PERCENT_PRESETS,
  marginFromBalancePercent,
} from '@/features/trading/order-ticket/apply-balance-percent';
import { isBalancePercentPresetActive } from '@/features/trading/order-ticket/order-ticket-display';
import { useT } from '@/product/i18n';
import { Button } from '@/product/primitives/button';
import { cn } from '@/product/primitives/lib/cn';

export type OrderTicketBalanceChipsProps = {
  avail: string;
  amount: string;
  onAmountChange: (value: string) => void;
  className?: string;
};

/** OKX-style balance % chips — 25/50/75/100 (display-only · Decimal). */
export function OrderTicketBalanceChips({
  avail,
  amount,
  onAmountChange,
  className,
}: OrderTicketBalanceChipsProps) {
  const t = useT();

  return (
    <div
      data-testid="order-ticket-balance-chips"
      className={cn('flex flex-wrap gap-2', className)}
      role="group"
      aria-label={t('trade.order.balancePercent')}
    >
      {BALANCE_PERCENT_PRESETS.map((preset) => {
        const active = isBalancePercentPresetActive(avail, amount, preset);
        return (
          <Button
            key={preset}
            type="button"
            size="sm"
            variant={active ? 'primary' : 'outline'}
            data-testid={`balance-percent-${preset}`}
            aria-pressed={active}
            onClick={() => onAmountChange(marginFromBalancePercent(avail, preset))}
          >
            {preset}%
          </Button>
        );
      })}
    </div>
  );
}
