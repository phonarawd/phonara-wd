import { createRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo } from 'react';
import { Route as rootRoute } from './__root';
import { useAuth } from '../contexts/auth-context';
import { useWallet } from '../hooks/use-wallet';
import { useTradeNotifications } from '../hooks/use-trade-notifications';
import {
  usePrices,
  useFuturesMarkets,
  useSpotMarkets,
  useFuturesPositions,
} from '../hooks/use-trading';
import { Card, Skeleton } from '@phonara/ui';
import { useRealtimeConnectionStore } from '../stores/realtime';
import { MarketDataStatus } from '../features/trading/market-data-status';
import { TradeNotificationCenter } from '../features/trading/trade-notification-center';
import { FuturesPanel } from '../features/trading/futures-panel';
import { SpotPanel } from '../features/trading/spot-panel';
import { OpenPositions } from '../features/trading/open-positions';
import { AppShell } from '../components/app-shell';
import { useT } from '../lib/i18n';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/trade',
  component: TradePage,
});

function TradePage() {
  const t = useT();
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { wallet, loading: walletLoading } = useWallet();
  const realtimeDisconnected = useRealtimeConnectionStore((s) => s.disconnected);
  const {
    prices,
    isError: pricesError,
    isFetching: pricesFetching,
    dataUpdatedAt: pricesUpdatedAt,
    refetch: refetchPrices,
    oracleStale,
    isPriceStale,
  } = usePrices();
  const { markets: futuresMarkets, loading: futuresMarketsLoading, isError: futuresMarketsError } = useFuturesMarkets();
  const { markets: spotMarkets, isError: spotMarketsError } = useSpotMarkets();
  const {
    positions,
    refresh,
    isError: positionsError,
    isFetching: positionsFetching,
    dataUpdatedAt: positionsUpdatedAt,
    refetch: refetchPositions,
  } = useFuturesPositions();
  const tradeNotifications = useTradeNotifications();
  const selectedSpotMarket = useMemo(
    () => spotMarkets.find((market) => market.symbol === 'PHON_USDT') ?? spotMarkets[0] ?? null,
    [spotMarkets],
  );

  useEffect(() => {
    if (!authLoading && !session) void navigate({ to: '/login' });
  }, [session, authLoading, navigate]);

  if (authLoading) {
    return (
      <AppShell active="trade">
        <div className="app-page" aria-busy="true">
          <Card className="grid w-full max-w-3xl gap-4 p-5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-[260px]" />
            <Skeleton className="h-24" />
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell active="trade">
      <div className="app-page">
        <section className="trade-ia-header" aria-labelledby="trade-page-title">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{t('nav.trade')}</p>
            <h1 id="trade-page-title" className="mt-1 text-2xl font-black text-fg">{t('trade.title')}</h1>
          </div>
          <div className="trade-ia-header-actions">
          <TradeNotificationCenter
            markets={futuresMarkets}
            prices={prices}
            notifications={tradeNotifications.notifications}
            permission={tradeNotifications.permission}
            permissionBusy={tradeNotifications.permissionBusy}
            permissionError={tradeNotifications.permissionError}
            pushConsent={tradeNotifications.pushConsent}
            priceAlert={tradeNotifications.priceAlert}
            onRequestPermission={tradeNotifications.requestBrowserNotifications}
            onSetPriceAlert={tradeNotifications.setPriceAlert}
            onClearPriceAlert={tradeNotifications.clearPriceAlert}
            onClearNotifications={tradeNotifications.clearNotifications}
          />
          </div>
        </section>

        <MarketDataStatus
          pricesError={pricesError}
          positionsError={positionsError}
          marketsError={futuresMarketsError || spotMarketsError}
          pricesFetching={pricesFetching}
          positionsFetching={positionsFetching}
          pricesUpdatedAt={pricesUpdatedAt}
          positionsUpdatedAt={positionsUpdatedAt}
          oracleStale={oracleStale}
          onRetry={() => {
            void refetchPrices();
            void refetchPositions();
          }}
        />

        <section className="trade-workspace">
          <FuturesPanel
            markets={futuresMarkets}
            marketsLoading={futuresMarketsLoading}
            prices={prices}
            phonAvail={wallet?.phon_available ?? '0'}
            usdtAvail={wallet?.usdt_available ?? '0'}
            walletLoading={walletLoading}
            isPriceStale={isPriceStale}
            realtimeDisconnected={realtimeDisconnected}
            onTraded={refresh}
          />
          <SpotPanel
            market={selectedSpotMarket}
            price={selectedSpotMarket ? (prices[selectedSpotMarket.symbol] ?? '0') : '0'}
            usdtAvail={wallet?.usdt_available ?? '0'}
            phonAvail={wallet?.phon_available ?? '0'}
            priceStale={selectedSpotMarket ? isPriceStale(selectedSpotMarket.symbol) : false}
            realtimeDisconnected={realtimeDisconnected}
          />
        </section>

        <OpenPositions
          positions={positions}
          prices={prices}
          isPriceStale={isPriceStale}
          realtimeDisconnected={realtimeDisconnected}
          onClosed={refresh}
        />
      </div>
    </AppShell>
  );
}
