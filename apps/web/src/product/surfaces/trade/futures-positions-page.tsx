import { useEffect } from 'react';

import { useFuturesPositionsPageController } from '@/features/trading/use-futures-positions-page-controller';
import { Button } from '@/product/primitives/button';
import { Skeleton } from '@/product/primitives/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/product/primitives/tabs';
import { cn } from '@/product/primitives/lib/cn';

import { FuturesPositionsPanel } from './futures-positions-panel';

function FuturesPositionsLoadingShell() {
  return (
    <div className="flex flex-col gap-4 py-4" data-testid="futures-positions-loading">
      <Skeleton className="h-10 w-1/3" />
      <Skeleton className="h-11 w-full max-w-md" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

/** Canonical `/trade/positions` — futures positions read (P9 · ENGINE:exists). */
export function FuturesPositionsPage() {
  const engine = useFuturesPositionsPageController();
  const {
    t,
    authLoading,
    positionsLoading,
    positionsError,
    activeTab,
    openPositions,
    closedPositions,
    openCount,
    closedCount,
    closeBusy,
    closingPositionId,
    partialCloseBusy,
    partialClosingPositionId,
    marginAdjustBusy,
    adjustingMarginPositionId,
    sltpEditBusy,
    updatingSltpPositionId,
    setActiveTab,
    closePosition,
    partialClosePosition,
    adjustIsolatedMargin,
    updatePositionSltp,
    markPrices,
    isMarkUnavailable,
    refresh,
  } = engine;

  useEffect(() => {
    document.title = t('seo.trade.positions.title');
  }, [t]);

  if (authLoading || positionsLoading) {
    return <FuturesPositionsLoadingShell />;
  }

  return (
    <div
      data-testid="futures-positions-page"
      className={cn(
        '@container mx-auto flex w-full max-w-[1200px] flex-col gap-4 py-4',
        'md:gap-5 md:py-5',
      )}
    >
      <header className="flex flex-col gap-1">
        <h1 className="text-foreground m-0 text-2xl font-semibold md:text-3xl">
          {t('trade.panel.positions')}
        </h1>
        <p className="text-foreground-muted m-0 text-sm leading-relaxed">
          {t('seo.trade.positions.description')}
        </p>
      </header>

      {positionsError ? (
        <div
          className="border-line bg-surface rounded-(--ds-radius-lg) flex flex-col gap-3 border p-4"
          data-testid="futures-positions-error"
        >
          <p className="text-foreground m-0 text-sm">{t('trade.positions.loadError')}</p>
          <Button type="button" variant="outline" size="sm" onClick={refresh}>
            {t('common.retry')}
          </Button>
        </div>
      ) : null}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="open" data-testid="futures-positions-tab-open">
            {t('trade.positions.tabOpen')}
            {openCount > 0 ? (
              <span className="text-foreground-muted tabular-nums">({openCount})</span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="closed" data-testid="futures-positions-tab-closed">
            {t('trade.positions.tabClosed')}
            {closedCount > 0 ? (
              <span className="text-foreground-muted tabular-nums">({closedCount})</span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open">
          <FuturesPositionsPanel
            positions={openPositions}
            t={t}
            variant="full"
            showHeading={false}
            emptyKey="trade.empty.positions"
            onClosePosition={closePosition}
            onPartialClosePosition={partialClosePosition}
            onAdjustIsolatedMargin={adjustIsolatedMargin}
            onUpdatePositionSltp={updatePositionSltp}
            closingPositionId={closingPositionId}
            partialClosingPositionId={partialClosingPositionId}
            adjustingMarginPositionId={adjustingMarginPositionId}
            updatingSltpPositionId={updatingSltpPositionId}
            closeBusy={closeBusy}
            partialCloseBusy={partialCloseBusy}
            marginAdjustBusy={marginAdjustBusy}
            sltpEditBusy={sltpEditBusy}
            markPrices={markPrices}
            isMarkUnavailable={isMarkUnavailable}
          />
        </TabsContent>
        <TabsContent value="closed">
          <FuturesPositionsPanel
            positions={closedPositions}
            t={t}
            variant="full"
            showHeading={false}
            emptyKey="trade.empty.closedPositions"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
