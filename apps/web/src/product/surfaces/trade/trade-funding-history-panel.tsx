import type { MessageKey } from '@phonara/i18n';

import { TRADE_DESK_TABLE_SCROLL_CLASS } from '@/domain/trade-ultra-layout-display-contract';
import type { FundingPayment } from '@/hooks/use-trading';
import { cn } from '@/product/primitives/lib/cn';
import { MoneyDisplay } from '@/product/primitives/money-display';
import { Skeleton } from '@/product/primitives/skeleton';

export type TradeFundingHistoryPanelProps = {
  payments: FundingPayment[];
  t: (key: MessageKey) => string;
  locale: string;
  className?: string;
  variant?: 'compact' | 'full';
  showHeading?: boolean;
  emptyKey?: MessageKey;
  loading?: boolean;
};

function formatFundingTime(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'ko-KR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** User funding payments — `funding_payments` rows only (display-only · §22.2.4). */
export function TradeFundingHistoryPanel({
  payments,
  t,
  locale,
  className,
  variant = 'compact',
  showHeading = true,
  emptyKey = 'trade.empty.fundingHistory',
  loading = false,
}: TradeFundingHistoryPanelProps) {
  const isFull = variant === 'full';

  return (
    <section
      data-testid="trade-funding-history-panel"
      className={cn('border-line bg-surface rounded-(--ds-radius-lg) border p-4', className)}
    >
      {showHeading ? (
        <h2 className="text-foreground m-0 text-sm font-semibold">
          {t('trade.panel.fundingHistory')}
        </h2>
      ) : null}

      {loading ? (
        <Skeleton className="mt-3 h-24 w-full" data-testid="trade-funding-history-panel-loading" />
      ) : payments.length === 0 ? (
        <p className="text-foreground-muted m-0 mt-3 text-sm">{t(emptyKey)}</p>
      ) : (
        <div
          className={cn(
            showHeading ? 'mt-3' : undefined,
            TRADE_DESK_TABLE_SCROLL_CLASS,
            'overflow-x-auto',
          )}
        >
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="text-foreground-muted text-left text-xs">
                <th className="pb-2 font-medium">{t('trade.time')}</th>
                <th className="pb-2 font-medium">{t('confirm.row.market')}</th>
                <th className="pb-2 font-medium">{t('trade.funding.columnAmount')}</th>
                {isFull ? <th className="pb-2 font-medium">{t('trade.marginCurrency')}</th> : null}
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr
                  key={payment.id}
                  className="border-line border-t"
                  data-testid="trade-funding-payment-row"
                >
                  <td className="py-2 tabular-nums">
                    {formatFundingTime(payment.created_at, locale)}
                  </td>
                  <td className="py-2 tabular-nums">{payment.market}</td>
                  <td className="py-2">
                    <MoneyDisplay
                      amount={payment.amount}
                      currency={payment.currency}
                      showCurrency
                      signed
                      className="text-foreground text-sm tabular-nums"
                    />
                  </td>
                  {isFull ? (
                    <td className="py-2 tabular-nums" data-testid="trade-funding-payment-currency">
                      {payment.currency}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
