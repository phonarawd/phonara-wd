import { useEffect } from 'react';

import { useFuturesOrdersPageController } from '@/features/trading/use-futures-orders-page-controller';
import { Button } from '@/product/primitives/button';
import { Skeleton } from '@/product/primitives/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/product/primitives/tabs';
import { cn } from '@/product/primitives/lib/cn';

import { OpenOrdersPanel } from './open-orders-panel';
import { TradeFillsHistoryPanel } from './trade-fills-history-panel';

function FuturesOrdersLoadingShell() {
  return (
    <div className="flex flex-col gap-4 py-4" data-testid="futures-orders-loading">
      <Skeleton className="h-10 w-1/3" />
      <Skeleton className="h-11 w-full max-w-md" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

/** Canonical `/trade/orders` — futures open orders + fill history (P9 · ENGINE:exists). */
export function FuturesOrdersPage() {
  const engine = useFuturesOrdersPageController();
  const {
    t,
    locale,
    authLoading,
    activeTab,
    setActiveTab,
    ordersLoading,
    ordersError,
    orders,
    orderCount,
    fillsLoading,
    fillsError,
    fills,
    fillCount,
    cancelBusy,
    cancellingOrderId,
    cancelOrder,
    refresh,
  } = engine;

  useEffect(() => {
    document.title = t('seo.trade.orders.title');
  }, [t]);

  if (authLoading || ordersLoading || fillsLoading) {
    return <FuturesOrdersLoadingShell />;
  }

  const showLoadError = ordersError || fillsError;

  return (
    <div
      data-testid="futures-orders-page"
      className={cn(
        '@container mx-auto flex w-full max-w-[1200px] flex-col gap-4 py-4',
        'md:gap-5 md:py-5',
      )}
    >
      <header className="flex flex-col gap-1">
        <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
          {t('trade.panel.openOrders')}
        </h1>
        <p className="text-foreground-muted m-0 text-sm leading-relaxed">
          {t('seo.trade.orders.description')}
        </p>
      </header>

      {showLoadError ? (
        <div
          className="border-line bg-surface rounded-(--ds-radius-lg) flex flex-col gap-3 border p-4"
          data-testid="futures-orders-error"
        >
          <p className="text-foreground m-0 text-sm">{t('trade.orders.loadError')}</p>
          <Button type="button" variant="outline" size="sm" onClick={refresh}>
            {t('common.retry')}
          </Button>
        </div>
      ) : null}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="open" data-testid="futures-orders-tab-open">
            {t('trade.panel.openOrders')}
            {orderCount > 0 ? (
              <span className="text-foreground-muted tabular-nums">({orderCount})</span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="futures-orders-tab-history">
            {t('trade.panel.history')}
            {fillCount > 0 ? (
              <span className="text-foreground-muted tabular-nums">({fillCount})</span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open">
          <OpenOrdersPanel
            orders={orders}
            t={t}
            variant="full"
            showHeading={false}
            onCancelOrder={cancelOrder}
            cancellingOrderId={cancellingOrderId}
            cancelBusy={cancelBusy}
          />
        </TabsContent>
        <TabsContent value="history">
          <TradeFillsHistoryPanel
            fills={fills}
            t={t}
            locale={locale}
            variant="full"
            showHeading={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
