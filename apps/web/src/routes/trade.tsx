import { createRoute, useNavigate, Link } from '@tanstack/react-router';
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
import { useT } from '../lib/i18n';
import { useRealtimeConnectionStore } from '../stores/realtime';
import { MarketDataStatus } from '../features/trading/market-data-status';
import { TradeNotificationCenter } from '../features/trading/trade-notification-center';
import { FuturesPanel } from '../features/trading/futures-panel';
import { SpotPanel } from '../features/trading/spot-panel';
import { OpenPositions } from '../features/trading/open-positions';

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
      <div className="shell">
        <Card className="grid w-full max-w-3xl gap-4 p-5" aria-busy="true">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-[260px]" />
          <Skeleton className="h-24" />
        </Card>
      </div>
    );
  }

  return (
    <div className="shell">
      <div className="dashboard">
        <header className="dash-header">
          <div className="dash-logo">
            <Link to="/dashboard" className="logo-name" style={{ textDecoration: 'none' }}>← PHONARA</Link>
          </div>
          <nav className="dash-nav">
            <Link to="/staking" className="nav-link">{t('nav.staking')}</Link>
            <Link to="/dashboard" className="nav-link">{t('nav.dashboard')}</Link>
          </nav>
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
        </header>

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

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(320px,3fr)]">
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
    </div>
  );
}
