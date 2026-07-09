import type { MessageKey } from '@phonara/i18n';
import { memo } from 'react';
import type { FuturesMarket } from '@/hooks/use-trading';
import type { FundingRateTone } from '@/lib/format-funding-rate-display';
import { TradeHelpTip } from '@/features/trading/trade-beginner-help/trade-help-tip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/product/primitives/select';
import { cn } from '@/product/primitives/lib/cn';

import { TradeMarketTickerStatsWire } from './trade-market-ticker-stats-wire';
import { TradePriceWithFiatHint } from './trade-price-with-fiat-hint';
import { TradeDisplayFeedStaleBadge } from './trade-display-feed-stale-badge';
import { TradePriceAlertControl } from './trade-price-alert-control';
import { useDisplayFeedStale } from '@/features/trading/market-store/use-display-feed-stale';
import { useTradeFiatHint } from '@/features/trading/use-trade-fiat-hint';

export type FuturesMarketHeaderProps = {
  markets: FuturesMarket[];
  marketsLoading: boolean;
  selectedSymbol: string;
  pairLabel: string;
  priceDisplay: string;
  markPriceDisplay: string;
  /** Raw oracle last price (USDT) for FiatHint — display-only secondary. */
  lastPriceAmount?: string;
  /** Raw oracle mark price (USDT) for FiatHint — display-only secondary. */
  markPriceAmount?: string;
  /** When true, fiat hints show `—` per §13.1.4.4 Trade oracle stale rule. */
  priceOracleStale?: boolean;
  fundingDisplay: string;
  fundingTone: FundingRateTone;
  onMarketChange: (symbol: string) => void;
  t: (key: MessageKey) => string;
};

type FuturesLastPriceProps = {
  label: string;
  priceDisplay: string;
  lastPriceAmount?: string;
  priceOracleStale: boolean;
};

const FuturesLastPrice = memo(function FuturesLastPrice({
  label,
  priceDisplay,
  lastPriceAmount,
  priceOracleStale,
}: FuturesLastPriceProps) {
  const { hintFor } = useTradeFiatHint();
  const staleOpts = { oracleStale: priceOracleStale } as const;
  const lastPriceHint =
    lastPriceAmount && lastPriceAmount !== '0' ? hintFor(lastPriceAmount, 'USDT', staleOpts) : null;

  return (
    <div>
      <p className="text-foreground-muted m-0 text-xs">{label}</p>
      {lastPriceHint && !lastPriceHint.disabled ? (
        <TradePriceWithFiatHint
          primaryDisplay={priceDisplay}
          fiatHint={lastPriceHint}
          testId="futures-last-price"
          primaryClassName="text-foreground m-0 text-2xl font-semibold tabular-nums"
        />
      ) : (
        <p
          data-testid="futures-last-price"
          className="text-foreground m-0 text-2xl font-semibold tabular-nums"
        >
          {priceDisplay}
        </p>
      )}
    </div>
  );
});

type FuturesMarkPriceProps = {
  label: string;
  markPriceDisplay: string;
  markPriceAmount?: string;
  priceOracleStale: boolean;
};

const FuturesMarkPrice = memo(function FuturesMarkPrice({
  label,
  markPriceDisplay,
  markPriceAmount,
  priceOracleStale,
}: FuturesMarkPriceProps) {
  const { hintFor } = useTradeFiatHint();
  const staleOpts = { oracleStale: priceOracleStale } as const;
  const markPriceHint =
    markPriceAmount && markPriceAmount !== '0' ? hintFor(markPriceAmount, 'USDT', staleOpts) : null;

  return (
    <div>
      <p className="text-foreground-muted m-0 flex items-center gap-1 text-xs">
        {label}
        <TradeHelpTip termId="mark_price" className="text-xs" />
      </p>
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

type FuturesFundingRateProps = {
  label: string;
  fundingDisplay: string;
  fundingTone: FundingRateTone;
};

const FuturesFundingRate = memo(function FuturesFundingRate({
  label,
  fundingDisplay,
  fundingTone,
}: FuturesFundingRateProps) {
  return (
    <div>
      <p className="text-foreground-muted m-0 flex items-center gap-1 text-xs">
        {label}
        <TradeHelpTip termId="funding" className="text-xs" />
      </p>
      <p
        data-testid="futures-funding-rate"
        className={cn(
          'm-0 text-sm tabular-nums',
          fundingTone === 'up' && 'text-market-up',
          fundingTone === 'down' && 'text-market-down',
          fundingTone === 'neutral' && 'text-foreground',
        )}
      >
        {fundingDisplay}
      </p>
    </div>
  );
});

type FuturesMarketSelectorProps = {
  markets: FuturesMarket[];
  marketsLoading: boolean;
  selectedSymbol: string;
  pairLabel: string;
  onMarketChange: (symbol: string) => void;
  titleKey: string;
  t: (key: MessageKey) => string;
};

const FuturesMarketSelector = memo(function FuturesMarketSelector({
  markets,
  marketsLoading,
  selectedSymbol,
  pairLabel,
  onMarketChange,
  titleKey,
  t,
}: FuturesMarketSelectorProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <Select
        value={selectedSymbol}
        onValueChange={onMarketChange}
        disabled={marketsLoading || markets.length === 0}
      >
        <SelectTrigger
          className="w-full min-w-[10rem] sm:w-[12rem]"
          aria-label={t('trade.futuresTitle')}
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
        <p className="text-foreground-muted m-0 text-xs uppercase tracking-wide">{titleKey}</p>
        <p className="text-foreground m-0 truncate text-lg font-semibold tabular-nums">
          {pairLabel}
        </p>
      </div>
    </div>
  );
});

export const FuturesMarketHeader = memo(function FuturesMarketHeader({
  markets,
  marketsLoading,
  selectedSymbol,
  pairLabel,
  priceDisplay,
  markPriceDisplay,
  lastPriceAmount,
  markPriceAmount,
  priceOracleStale = false,
  fundingDisplay,
  fundingTone,
  onMarketChange,
  t,
}: FuturesMarketHeaderProps) {
  const { anyStale: displayFeedStale } = useDisplayFeedStale(selectedSymbol);

  return (
    <header
      data-testid="futures-market-header"
      className="border-line bg-surface flex flex-col gap-3 rounded-(--ds-radius-lg) border p-4 lg:flex-row lg:items-start lg:justify-between"
    >
      <FuturesMarketSelector
        markets={markets}
        marketsLoading={marketsLoading}
        selectedSymbol={selectedSymbol}
        pairLabel={pairLabel}
        onMarketChange={onMarketChange}
        titleKey={t('trade.futuresTitle')}
        t={t}
      />

      <div className="flex min-w-0 flex-col gap-3 lg:items-end">
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-end">
          <TradeDisplayFeedStaleBadge visible={displayFeedStale} t={t} />
          <TradePriceAlertControl symbol={selectedSymbol} currentPrice={lastPriceAmount} t={t} />
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <FuturesLastPrice
            label={t('trade.mobile.lastPrice')}
            priceDisplay={priceDisplay}
            lastPriceAmount={lastPriceAmount}
            priceOracleStale={priceOracleStale}
          />
          <FuturesMarkPrice
            label={t('trade.markPrice')}
            markPriceDisplay={markPriceDisplay}
            markPriceAmount={markPriceAmount}
            priceOracleStale={priceOracleStale}
          />
          <FuturesFundingRate
            label={t('trade.funding')}
            fundingDisplay={fundingDisplay}
            fundingTone={fundingTone}
          />
        </div>
        <TradeMarketTickerStatsWire
          selectedSymbol={selectedSymbol}
          mode="futures"
          t={t}
          className="w-full lg:items-end"
        />
      </div>
    </header>
  );
});
