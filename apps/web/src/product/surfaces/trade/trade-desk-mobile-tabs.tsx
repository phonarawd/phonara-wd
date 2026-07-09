import { useState, type ReactNode } from 'react';
import { ArrowLeftRight, History, Layers, LineChart, type LucideIcon } from 'lucide-react';

import type { MessageKey } from '@phonara/i18n';

import {
  TRADE_DESK_MOBILE_ROOT_CLASS,
  TRADE_DESK_MOBILE_STICKY_CTA_CLASS,
  TRADE_DESK_MOBILE_SWIPE_SURFACE_CLASS,
  TRADE_DESK_MOBILE_SWIPE_SURFACE_TESTID,
  TRADE_DESK_MOBILE_TAB_ICON_CLASS,
  TRADE_DESK_MOBILE_TAB_IDS,
  TRADE_DESK_MOBILE_TAB_LABEL_CLASS,
  TRADE_DESK_MOBILE_TAB_TRIGGER_CLASS,
  TRADE_DESK_MOBILE_TABLIST_CLASS,
  TRADE_DESK_MOBILE_TABS_CLASS,
  TRADE_DESK_MOBILE_TRADE_STACK_CLASS,
  TRADE_DESK_MOBILE_TRADE_SUBTAB_IDS,
  type TradeDeskMobileTabId,
  type TradeDeskMobileTradeSubtabId,
} from '@/domain/trade-mobile-layout-display-contract';
import { useTradeDeskMobileChartTradeSwipe } from '@/features/trading/use-trade-desk-mobile-chart-trade-swipe';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/product/primitives/tabs';
import { cn } from '@/product/primitives/lib/cn';

const MOBILE_TAB_LABEL_KEYS: Record<TradeDeskMobileTabId, MessageKey> = {
  chart: 'trade.chartTitle',
  trade: 'trade.order.title',
  positions: 'trade.panel.positions',
  history: 'trade.panel.history',
};

const MOBILE_TAB_SHORT_LABEL_KEYS: Record<TradeDeskMobileTabId, MessageKey> = {
  chart: 'trade.mobile.tab.chart',
  trade: 'trade.mobile.tab.trade',
  positions: 'trade.mobile.tab.positions',
  history: 'trade.mobile.tab.history',
};

const MOBILE_TAB_ICONS: Record<TradeDeskMobileTabId, LucideIcon> = {
  chart: LineChart,
  trade: ArrowLeftRight,
  positions: Layers,
  history: History,
};

const MOBILE_TRADE_SUBTAB_LABEL_KEYS: Record<TradeDeskMobileTradeSubtabId, MessageKey> = {
  order: 'trade.order.title',
  book: 'trade.orderBook.title',
};

export type TradeDeskMobileTradeStackProps = {
  t: (key: MessageKey) => string;
  orderTicket?: ReactNode;
  book: ReactNode;
  stickyCta: ReactNode;
  /** Tablet tier — ticket lives in 2-col header; order subtab shows sticky CTA only. */
  ticketExternal?: boolean;
  className?: string;
};

/** Mobile trade tab — order | book subtabs · sticky CTA on order subtab only (extend-only · §22.2.3 H1). */
export function TradeDeskMobileTradeStack({
  t,
  orderTicket,
  book,
  stickyCta,
  ticketExternal = false,
  className,
}: TradeDeskMobileTradeStackProps) {
  const [tradeSubTab, setTradeSubTab] = useState<TradeDeskMobileTradeSubtabId>('order');

  return (
    <div
      className={cn(TRADE_DESK_MOBILE_TRADE_STACK_CLASS, 'flex flex-col gap-4', className)}
      data-testid="trade-desk-mobile-trade-stack"
    >
      <Tabs
        value={tradeSubTab}
        onValueChange={(value) => setTradeSubTab(value as TradeDeskMobileTradeSubtabId)}
      >
        <TabsList
          className="grid w-full grid-cols-2"
          data-testid="trade-desk-mobile-trade-subtablist"
        >
          {TRADE_DESK_MOBILE_TRADE_SUBTAB_IDS.map((subtabId) => (
            <TabsTrigger
              key={subtabId}
              value={subtabId}
              data-testid={`trade-desk-mobile-trade-subtab-${subtabId}`}
            >
              {t(MOBILE_TRADE_SUBTAB_LABEL_KEYS[subtabId])}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="order" data-testid="trade-desk-mobile-trade-panel-order">
          <div className="flex flex-col gap-4">
            {ticketExternal ? null : orderTicket}
            <div
              className={TRADE_DESK_MOBILE_STICKY_CTA_CLASS}
              data-testid="trade-desk-mobile-sticky-cta"
            >
              {stickyCta}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="book" data-testid="trade-desk-mobile-trade-panel-book">
          {book}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export type TradeDeskMobileTabsProps = {
  testId: string;
  t: (key: MessageKey) => string;
  chart: ReactNode;
  trade: ReactNode;
  positions: ReactNode;
  history: ReactNode;
  defaultTab?: TradeDeskMobileTabId;
  className?: string;
};

/** `<lg` desk tabs — chart | trade | positions | history · trade stack owns order|book + sticky CTA. */
export function TradeDeskMobileTabs({
  testId,
  t,
  chart,
  trade,
  positions,
  history,
  defaultTab = 'chart',
  className,
}: TradeDeskMobileTabsProps) {
  const [activeTab, setActiveTab] = useState<TradeDeskMobileTabId>(defaultTab);
  const { swipeActive, swipeHandlers } = useTradeDeskMobileChartTradeSwipe(activeTab, setActiveTab);

  return (
    <div
      className={cn(
        TRADE_DESK_MOBILE_ROOT_CLASS,
        TRADE_DESK_MOBILE_TABS_CLASS,
        'md:hidden',
        className,
      )}
      data-testid={testId}
    >
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TradeDeskMobileTabId)}
      >
        <TabsList
          className={cn('grid w-full grid-cols-4', TRADE_DESK_MOBILE_TABLIST_CLASS)}
          data-testid="trade-desk-mobile-tablist"
        >
          {TRADE_DESK_MOBILE_TAB_IDS.map((tabId) => {
            const Icon = MOBILE_TAB_ICONS[tabId];

            return (
              <TabsTrigger
                key={tabId}
                value={tabId}
                className={TRADE_DESK_MOBILE_TAB_TRIGGER_CLASS}
                aria-label={t(MOBILE_TAB_LABEL_KEYS[tabId])}
                data-testid={`trade-desk-mobile-tab-${tabId}`}
              >
                <Icon
                  className={TRADE_DESK_MOBILE_TAB_ICON_CLASS}
                  aria-hidden
                  data-testid="trade-desk-mobile-tab-icon"
                />
                <span
                  className={TRADE_DESK_MOBILE_TAB_LABEL_CLASS}
                  data-testid={`trade-desk-mobile-tab-label-${tabId}`}
                >
                  {t(MOBILE_TAB_SHORT_LABEL_KEYS[tabId])}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div
          className={cn(
            TRADE_DESK_MOBILE_SWIPE_SURFACE_CLASS,
            swipeActive && 'trade-desk-mobile-swipe-active',
          )}
          data-testid={TRADE_DESK_MOBILE_SWIPE_SURFACE_TESTID}
          {...swipeHandlers}
        >
          <TabsContent value="chart" data-testid="trade-desk-mobile-panel-chart">
            <div className={cn(swipeActive && 'pointer-events-none')}>{chart}</div>
          </TabsContent>

          <TabsContent value="trade" data-testid="trade-desk-mobile-panel-trade">
            <div className={cn(swipeActive && 'pointer-events-none')}>{trade}</div>
          </TabsContent>
        </div>

        <TabsContent value="positions" data-testid="trade-desk-mobile-panel-positions">
          {positions}
        </TabsContent>

        <TabsContent value="history" data-testid="trade-desk-mobile-panel-history">
          {history}
        </TabsContent>
      </Tabs>
    </div>
  );
}
