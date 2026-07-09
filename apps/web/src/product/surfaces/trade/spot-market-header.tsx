import type { MessageKey } from '@phonara/i18n';
import { memo } from 'react';
import type { SpotMarket } from '@/hooks/use-trading';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/product/primitives/select';

import { TradeMarketTickerStatsWire } from './trade-market-ticker-stats-wire';
import { TradePriceDirTicker } from './trade-price-dir-ticker';
import { TradePriceWithFiatHint } from './trade-price-with-fiat-hint';
import { TradeDisplayFeedStaleBadge } from './trade-display-feed-stale-badge';
import { TradePriceAlertControl } from './trade-price-alert-control';
import { useDisplayFeedStale } from '@/features/trading/market-store/use-display-feed-stale';
import { useTradeFiatHint } from '@/features/trading/use-trade-fiat-hint';

export type SpotMarketHeaderProps = {
  markets: SpotMarket[];
  selectedSymbol: string;
  pairLabel: string;
  priceDisplay: string;
  markPriceDisplay: string;
  /** Raw last price for tick direction — display-only. */
  lastPriceRaw?: string | null;
  /** Raw oracle last price (USDT) for FiatHint — display-only secondary. */
  lastPriceAmount?: string;
  /** Raw oracle mark price (USDT) for FiatHint — display-only secondary. */
  markPriceAmount?: string;
  /** When true, fiat hints show `—` per §13.1.4.4 Trade oracle stale rule. */
  priceOracleStale?: boolean;
  onMarketChange: (symbol: string) => void;
  t: (key: MessageKey) => string;
};

type SpotMarkPriceProps = {
  label: string;
  markPriceDisplay: string;
  markPriceAmount?: string;
  priceOracleStale: boolean;
};

const SpotMarkPrice = memo(function SpotMarkPrice({
  label,
  markPriceDisplay,
  markPriceAmount,
  priceOracleStale,
}: SpotMarkPriceProps) {
  const { hintFor } = useTradeFiatHint();
  const staleOpts = { oracleStale: priceOracleStale } as const;
  const markPriceHint =
    markPriceAmount && markPriceAmount !== '0' ? hintFor(markPriceAmount, 'USDT', staleOpts) : null;

  return (
    <div>
      <p className="text-foreground-muted m-0 text-xs">{label}</p>
      {markPriceHint && !markPriceHint.disabled ? (
        <TradePriceWithFiatHint
          primaryDisplay={markPriceDisplay}
          fiatHint={markPriceHint}
          primaryClassName="text-foreground m-0 text-sm tabular-nums"
        />
      ) : (
        <p className="text-foreground m-0 text-sm tabular-nums">{markPriceDisplay}</p>
      )}
    </div>
  );
});

type SpotMarketSelectorProps = {
  markets: SpotMarket[];
  selectedSymbol: string;
  pairLabel: string;
  onMarketChange: (symbol: string) => void;
  pairLabelKey: string;
  t: (key: MessageKey) => string;
};

const SpotMarketSelector = memo(function SpotMarketSelector({
  markets,
  selectedSymbol,
  pairLabel,
  onMarketChange,
  pairLabelKey,
  t,
}: SpotMarketSelectorProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <Select value={selectedSymbol} onValueChange={onMarketChange}>
        <SelectTrigger
          className="w-full min-w-[10rem] sm:w-[12rem]"
          aria-label={t('trade.spot.pairLabel')}
        >
          <SelectValue placeholder={pairLabel} />
        </SelectTrigger>
        <SelectContent>
          {markets.map((market) => (
            <SelectItem key={market.symbol} value={market.symbol}>
              {market.display_name ?? market.symbol}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="min-w-0">
        <p className="text-foreground-muted m-0 text-xs uppercase tracking-wide">{pairLabelKey}</p>
        <p className="text-foreground m-0 truncate text-lg font-semibold tabular-nums">
          {pairLabel}
        </p>
      </div>
    </div>
  );
});

export const SpotMarketHeader = memo(function SpotMarketHeader({
  markets,
  selectedSymbol,
  pairLabel,
  priceDisplay,
  markPriceDisplay,
  lastPriceRaw,
  lastPriceAmount,
  markPriceAmount,
  priceOracleStale = false,
  onMarketChange,
  t,
}: SpotMarketHeaderProps) {
  const { anyStale: displayFeedStale } = useDisplayFeedStale(selectedSymbol);

  return (
    <header
      data-testid="spot-market-header"
      className="border-line bg-surface flex flex-col gap-3 rounded-(--ds-radius-lg) border p-4 lg:flex-row lg:items-start lg:justify-between"
    >
      <SpotMarketSelector
        markets={markets}
        selectedSymbol={selectedSymbol}
        pairLabel={pairLabel}
        onMarketChange={onMarketChange}
        pairLabelKey={t('trade.spot.pairLabel')}
        t={t}
      />

      <div className="flex min-w-0 flex-col gap-3 lg:items-end">
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-end">
          <TradeDisplayFeedStaleBadge visible={displayFeedStale} t={t} />
          <TradePriceAlertControl
            symbol={selectedSymbol}
            currentPrice={lastPriceAmount ?? lastPriceRaw}
            t={t}
          />
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <TradePriceDirTicker
            label={t('trade.mobile.lastPrice')}
            priceDisplay={priceDisplay}
            lastPriceRaw={lastPriceRaw}
            lastPriceAmount={lastPriceAmount}
            priceOracleStale={priceOracleStale}
            testId="spot-last-price"
          />
          <SpotMarkPrice
            label={t('trade.markPrice')}
            markPriceDisplay={markPriceDisplay}
            markPriceAmount={markPriceAmount}
            priceOracleStale={priceOracleStale}
          />
        </div>
        <TradeMarketTickerStatsWire
          selectedSymbol={selectedSymbol}
          mode="spot"
          t={t}
          className="w-full lg:items-end"
        />
      </div>
    </header>
  );
});
