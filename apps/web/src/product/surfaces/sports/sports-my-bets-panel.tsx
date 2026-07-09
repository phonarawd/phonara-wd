import { MoneyDisplay } from '@/product/primitives/money-display';
import { Skeleton } from '@/product/primitives/skeleton';
import type { MessageKey } from '@phonara/i18n';

type SportsBetRow = {
  bet_id?: string;
  status?: string;
  stake?: string;
  currency?: string;
  combined_odds?: string;
  potential_payout?: string;
};

function asBetRows(input: unknown[]): SportsBetRow[] {
  return input.filter((row): row is SportsBetRow => typeof row === 'object' && row != null);
}

function statusKey(status: string | undefined): MessageKey {
  switch (status) {
    case 'won':
      return 'sports.bet.status.won';
    case 'lost':
      return 'sports.bet.status.lost';
    case 'void':
      return 'sports.bet.status.void';
    case 'cashed_out':
      return 'sports.bet.status.cashed_out';
    default:
      return 'sports.bet.status.pending';
  }
}

export function SportsMyBetsPanel({
  bets,
  loading,
  t,
}: {
  bets: unknown[];
  loading: boolean;
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
}) {
  if (loading) {
    return (
      <div data-testid="sports-my-bets-loading">
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const rows = asBetRows(bets);
  if (rows.length === 0) {
    return (
      <p className="text-foreground-muted m-0 text-sm" data-testid="sports-my-bets-empty">
        {t('sports.myBets.empty')}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2" data-testid="sports-my-bets-panel">
      {rows.map((row) => {
        const currency = row.currency === 'PHON' ? 'PHON' : 'USDT';
        return (
          <article
            key={row.bet_id ?? `${row.stake}-${row.status}`}
            className="border-line bg-surface rounded-(--ds-radius-md) border px-3 py-2"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-foreground text-sm font-medium">
                {t(statusKey(row.status))}
              </span>
              {row.stake ? (
                <MoneyDisplay
                  amount={row.stake}
                  currency={currency}
                  showCurrency
                  className="text-sm"
                />
              ) : null}
            </div>
            {row.potential_payout ? (
              <p className="text-foreground-muted m-0 mt-1 text-xs">
                {t('sports.slip.payout')}:{' '}
                <MoneyDisplay
                  amount={row.potential_payout}
                  currency={currency}
                  showCurrency
                  className="inline text-xs"
                />
              </p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
