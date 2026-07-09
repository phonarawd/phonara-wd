import { useState } from 'react';

import type { MessageKey } from '@phonara/i18n';

import type {
  FundingPayment,
  FuturesPosition,
  TradingOpenOrder,
  TradingOrderFill,
} from '@/hooks/use-trading';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/product/primitives/tabs';
import { cn } from '@/product/primitives/lib/cn';

import { FuturesPositionsPanel } from './futures-positions-panel';
import { OpenOrdersPanel } from './open-orders-panel';
import { TradeFillsHistoryPanel } from './trade-fills-history-panel';
import { TradeFundingHistoryPanel } from './trade-funding-history-panel';

export type TradeDeskBottomDockTab = 'positions' | 'openOrders' | 'history';
export type TradeDeskHistorySubTab = 'tradeFills' | 'funding';

export type TradeDeskMobileHistoryStackProps = {
  orders: TradingOpenOrder[];
  fills: TradingOrderFill[];
  fundingPayments?: FundingPayment[];
  t: (key: MessageKey) => string;
  locale: string;
  onCancelOrder?: (orderId: string) => void;
  cancellingOrderId?: string | null;
  cancelBusy?: boolean;
  showFunding?: boolean;
  className?: string;
  ordersLoading?: boolean;
  fillsLoading?: boolean;
  fundingPaymentsLoading?: boolean;
};

/** Mobile history tab — same panels as lg+ dock openOrders + history (extend-only · no copy-paste table). */
export function TradeDeskMobileHistoryStack({
  orders,
  fills,
  fundingPayments = [],
  t,
  locale,
  onCancelOrder,
  cancellingOrderId = null,
  cancelBusy = false,
  showFunding = true,
  className,
  ordersLoading = false,
  fillsLoading = false,
  fundingPaymentsLoading = false,
}: TradeDeskMobileHistoryStackProps) {
  const [historySubTab, setHistorySubTab] = useState<TradeDeskHistorySubTab>('tradeFills');

  return (
    <div
      className={cn('flex flex-col gap-4', className)}
      data-testid="trade-desk-mobile-history-stack"
    >
      <OpenOrdersPanel
        orders={orders}
        t={t}
        variant="full"
        showHeading
        onCancelOrder={onCancelOrder}
        cancellingOrderId={cancellingOrderId}
        cancelBusy={cancelBusy}
        loading={ordersLoading}
      />
      <Tabs
        value={historySubTab}
        onValueChange={(value) => setHistorySubTab(value as TradeDeskHistorySubTab)}
      >
        <TabsList
          className={cn('grid w-full max-w-md', showFunding ? 'grid-cols-2' : 'grid-cols-1')}
        >
          <TabsTrigger value="tradeFills" data-testid="trade-desk-mobile-history-subtab-fills">
            {t('trade.panel.tradeHistory')}
            {fills.length > 0 ? (
              <span className="text-foreground-muted tabular-nums">({fills.length})</span>
            ) : null}
          </TabsTrigger>
          {showFunding ? (
            <TabsTrigger value="funding" data-testid="trade-desk-mobile-history-subtab-funding">
              {t('trade.panel.fundingHistory')}
              {fundingPayments.length > 0 ? (
                <span className="text-foreground-muted tabular-nums">
                  ({fundingPayments.length})
                </span>
              ) : null}
            </TabsTrigger>
          ) : null}
        </TabsList>
        <TabsContent value="tradeFills">
          <TradeFillsHistoryPanel
            fills={fills}
            t={t}
            locale={locale}
            variant="full"
            showHeading={false}
            loading={fillsLoading}
          />
        </TabsContent>
        {showFunding ? (
          <TabsContent value="funding">
            <TradeFundingHistoryPanel
              payments={fundingPayments}
              t={t}
              locale={locale}
              variant="full"
              showHeading={false}
              loading={fundingPaymentsLoading}
            />
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}

export type TradeDeskBottomDockProps = {
  deskVariant?: 'spot' | 'futures';
  positions: FuturesPosition[];
  orders: TradingOpenOrder[];
  fills: TradingOrderFill[];
  fundingPayments: FundingPayment[];
  t: (key: MessageKey) => string;
  locale: string;
  onClosePosition?: (positionId: string) => void;
  onPartialClosePosition?: (positionId: string, closeRatio: string) => void;
  onAdjustIsolatedMargin?: (positionId: string, delta: string) => void;
  onUpdatePositionSltp?: (
    positionId: string,
    stopLoss: string | null,
    takeProfit: string | null,
  ) => void;
  onSetTrailingStop?: (
    positionId: string,
    callbackRate: string,
    activationPrice?: string | null,
  ) => void;
  onClearTrailingStop?: (positionId: string) => void;
  onCancelOrder?: (orderId: string) => void;
  closingPositionId?: string | null;
  partialClosingPositionId?: string | null;
  adjustingMarginPositionId?: string | null;
  updatingSltpPositionId?: string | null;
  trailingStopPositionId?: string | null;
  cancellingOrderId?: string | null;
  actionBusy?: boolean;
  className?: string;
  initialTab?: TradeDeskBottomDockTab;
  initialHistorySubTab?: TradeDeskHistorySubTab;
  markPrices?: Record<string, string | null | undefined>;
  isMarkUnavailable?: (market: string) => boolean;
  ordersLoading?: boolean;
  fillsLoading?: boolean;
  positionsLoading?: boolean;
  fundingPaymentsLoading?: boolean;
};

/** lg+ bottom strip — positions close · open orders cancel · fill history (§22.2.3 H1 · P9 step 7). */
export function TradeDeskBottomDock({
  deskVariant = 'futures',
  positions,
  orders,
  fills,
  fundingPayments,
  t,
  locale,
  onClosePosition,
  onPartialClosePosition,
  onAdjustIsolatedMargin,
  onUpdatePositionSltp,
  onSetTrailingStop,
  onClearTrailingStop,
  onCancelOrder,
  closingPositionId = null,
  partialClosingPositionId = null,
  adjustingMarginPositionId = null,
  updatingSltpPositionId = null,
  trailingStopPositionId = null,
  cancellingOrderId = null,
  actionBusy = false,
  className,
  initialTab = 'positions',
  initialHistorySubTab = 'tradeFills',
  markPrices,
  isMarkUnavailable,
  ordersLoading = false,
  fillsLoading = false,
  positionsLoading = false,
  fundingPaymentsLoading = false,
}: TradeDeskBottomDockProps) {
  const isSpotDesk = deskVariant === 'spot';
  const [activeTab, setActiveTab] = useState<TradeDeskBottomDockTab>(
    initialTab === 'positions' && isSpotDesk ? 'openOrders' : initialTab,
  );
  const [historySubTab, setHistorySubTab] = useState<TradeDeskHistorySubTab>(initialHistorySubTab);

  return (
    <section
      data-testid="trade-desk-bottom-dock"
      data-desk-variant={deskVariant}
      className={cn('border-line bg-surface rounded-(--ds-radius-lg) border p-4', className)}
    >
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TradeDeskBottomDockTab)}
      >
        <TabsList
          className={cn('grid w-full max-w-xl', isSpotDesk ? 'grid-cols-2' : 'grid-cols-3')}
        >
          {!isSpotDesk ? (
            <TabsTrigger value="positions" data-testid="trade-desk-dock-tab-positions">
              {t('trade.panel.positions')}
              {positions.length > 0 ? (
                <span className="text-foreground-muted tabular-nums">({positions.length})</span>
              ) : null}
            </TabsTrigger>
          ) : null}
          <TabsTrigger value="openOrders" data-testid="trade-desk-dock-tab-open-orders">
            {t('trade.panel.openOrders')}
            {orders.length > 0 ? (
              <span className="text-foreground-muted tabular-nums">({orders.length})</span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="trade-desk-dock-tab-history">
            {t('trade.panel.history')}
            {fills.length > 0 ? (
              <span className="text-foreground-muted tabular-nums">({fills.length})</span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        {!isSpotDesk ? (
          <TabsContent value="positions">
            <FuturesPositionsPanel
              positions={positions}
              t={t}
              variant="full"
              showHeading={false}
              emptyKey="trade.empty.positions"
              onClosePosition={onClosePosition}
              onPartialClosePosition={onPartialClosePosition}
              onAdjustIsolatedMargin={onAdjustIsolatedMargin}
              onUpdatePositionSltp={onUpdatePositionSltp}
              onSetTrailingStop={onSetTrailingStop}
              onClearTrailingStop={onClearTrailingStop}
              closingPositionId={closingPositionId}
              partialClosingPositionId={partialClosingPositionId}
              adjustingMarginPositionId={adjustingMarginPositionId}
              updatingSltpPositionId={updatingSltpPositionId}
              trailingStopPositionId={trailingStopPositionId}
              closeBusy={actionBusy}
              partialCloseBusy={actionBusy}
              marginAdjustBusy={actionBusy}
              sltpEditBusy={actionBusy}
              markPrices={markPrices}
              isMarkUnavailable={isMarkUnavailable}
              loading={positionsLoading}
            />
          </TabsContent>
        ) : null}
        <TabsContent value="openOrders">
          <OpenOrdersPanel
            orders={orders}
            t={t}
            variant="full"
            showHeading={false}
            onCancelOrder={onCancelOrder}
            cancellingOrderId={cancellingOrderId}
            cancelBusy={actionBusy}
            loading={ordersLoading}
          />
        </TabsContent>
        <TabsContent value="history">
          {isSpotDesk ? (
            <TradeFillsHistoryPanel
              fills={fills}
              t={t}
              locale={locale}
              variant="full"
              showHeading={false}
              loading={fillsLoading}
            />
          ) : (
            <Tabs
              value={historySubTab}
              onValueChange={(value) => setHistorySubTab(value as TradeDeskHistorySubTab)}
            >
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="tradeFills" data-testid="trade-desk-history-subtab-fills">
                  {t('trade.panel.tradeHistory')}
                  {fills.length > 0 ? (
                    <span className="text-foreground-muted tabular-nums">({fills.length})</span>
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="funding" data-testid="trade-desk-history-subtab-funding">
                  {t('trade.panel.fundingHistory')}
                  {fundingPayments.length > 0 ? (
                    <span className="text-foreground-muted tabular-nums">
                      ({fundingPayments.length})
                    </span>
                  ) : null}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="tradeFills">
                <TradeFillsHistoryPanel
                  fills={fills}
                  t={t}
                  locale={locale}
                  variant="full"
                  showHeading={false}
                  loading={fillsLoading}
                />
              </TabsContent>
              <TabsContent value="funding">
                <TradeFundingHistoryPanel
                  payments={fundingPayments}
                  t={t}
                  locale={locale}
                  variant="full"
                  showHeading={false}
                  loading={fundingPaymentsLoading}
                />
              </TabsContent>
            </Tabs>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
