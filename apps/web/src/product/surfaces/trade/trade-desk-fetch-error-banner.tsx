import {
  resolveTradeDeskFetchErrorVisible,
  TRADE_DESK_FETCH_ERROR_MESSAGE_KEY,
  TRADE_DESK_FETCH_ERROR_TEST_ID,
  type TradeDeskFetchErrorInput,
} from '@/domain/trade-desk-fetch-error-display-contract';
import { useT } from '@/product/i18n';
import { Button } from '@/product/primitives/button';
import { cn } from '@/product/primitives/lib/cn';

export type TradeDeskFetchErrorBannerProps = TradeDeskFetchErrorInput & {
  onRetry: () => void;
  className?: string;
};

/** P0-1 — prices/markets/spotMarkets fetch failure with retry (below desk status banner). */
export function TradeDeskFetchErrorBanner({
  pricesError,
  marketsError,
  spotMarketsError,
  onRetry,
  className,
}: TradeDeskFetchErrorBannerProps) {
  const t = useT();

  if (!resolveTradeDeskFetchErrorVisible({ pricesError, marketsError, spotMarketsError })) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      data-testid={TRADE_DESK_FETCH_ERROR_TEST_ID}
      className={cn(
        'border-line bg-surface rounded-(--ds-radius-lg) flex flex-col gap-3 border p-4',
        className,
      )}
    >
      <p className="text-foreground m-0 text-sm">{t(TRADE_DESK_FETCH_ERROR_MESSAGE_KEY)}</p>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        {t('common.retry')}
      </Button>
    </div>
  );
}
