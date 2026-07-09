import { AlertTriangle, Info } from 'lucide-react';

import { resolveTradeChartFeedStrategy } from '@/domain/trade-chart-mount-display-contract';
import {
  resolveTradeMarketStatusBanner,
  type TradeDeskKind,
} from '@/domain/trade-market-status-display-contract';
import { usePlatformGates } from '@/hooks/use-platform-gates';
import { usePrices } from '@/hooks/use-trading';
import { useT } from '@/product/i18n';
import { cn } from '@/product/primitives/lib/cn';

export type TradeMarketStatusBannerProps = {
  desk: TradeDeskKind;
  marketSymbol: string | null;
  symbolStale: boolean;
  symbolFrozen?: boolean;
  realtimeDisconnected?: boolean;
  className?: string;
};

function isPhonOracleOnlyMarket(marketSymbol: string | null): boolean {
  return resolveTradeChartFeedStrategy(marketSymbol) === 'oracle-rpc-only';
}

/** §25.12.9.1-E #20 — single mount below desk header · kill / circuit / disconnect / freeze / stale. */
export function TradeMarketStatusBanner({
  desk,
  marketSymbol,
  symbolStale,
  symbolFrozen = false,
  realtimeDisconnected = false,
  className,
}: TradeMarketStatusBannerProps) {
  const t = useT();
  const { systemHalted, spotBlocked, futuresBlocked } = usePlatformGates();
  const { isMarketHalted } = usePrices();

  const status = resolveTradeMarketStatusBanner({
    desk,
    systemHalted,
    spotBlocked,
    futuresBlocked,
    marketSymbol,
    marketHalted: marketSymbol ? isMarketHalted(marketSymbol) : false,
    symbolStale,
    symbolFrozen,
    realtimeDisconnected,
  });

  const showOracleOnly = !status && isPhonOracleOnlyMarket(marketSymbol);

  if (!status && !showOracleOnly) return null;

  if (showOracleOnly) {
    return (
      <div
        role="status"
        aria-live="polite"
        data-testid="trade-market-status-banner"
        data-status-kind="oracleOnly"
        className={cn(
          'border-line bg-surface-raised flex items-start gap-3 rounded-(--ds-radius-lg) border px-3 py-2.5 lg:px-4 lg:py-3',
          className,
        )}
      >
        <Info className="text-foreground-muted mt-0.5 size-4 shrink-0" aria-hidden />
        <div className="min-w-0">
          <p
            className="text-foreground m-0 text-sm font-semibold"
            data-testid="trade-market-status-banner-title"
          >
            {t('trade.chart.oracleOnly')}
          </p>
          <p
            className="text-foreground-muted m-0 mt-0.5 text-xs leading-relaxed lg:text-sm"
            data-testid="trade-market-status-banner-description"
          >
            {t('trade.chart.oracleOnlyDescription')}
          </p>
        </div>
      </div>
    );
  }

  const isHalt = status!.kind === 'kill' || status!.kind === 'circuit';
  const isWarning =
    status!.kind === 'stale' ||
    status!.kind === 'freeze' ||
    status!.kind === 'realtimeDisconnected';

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="trade-market-status-banner"
      data-status-kind={status!.kind}
      className={cn(
        'flex items-start gap-3 rounded-(--ds-radius-lg) border px-3 py-2.5 lg:px-4 lg:py-3',
        isHalt && 'border-danger/30 bg-danger/10',
        isWarning && 'border-warning/30 bg-warning/10',
        className,
      )}
    >
      <AlertTriangle
        className={cn(
          'mt-0.5 size-4 shrink-0',
          isHalt && 'text-danger',
          isWarning && 'text-warning',
        )}
        aria-hidden
      />
      <div className="min-w-0">
        <p
          className={cn(
            'm-0 text-sm font-semibold',
            isHalt && 'text-danger',
            isWarning && 'text-warning',
          )}
          data-testid="trade-market-status-banner-title"
        >
          {t(status!.titleKey)}
        </p>
        <p
          className="text-foreground-muted m-0 mt-0.5 text-xs leading-relaxed lg:text-sm"
          data-testid="trade-market-status-banner-description"
        >
          {t(status!.descriptionKey)}
        </p>
      </div>
    </div>
  );
}
