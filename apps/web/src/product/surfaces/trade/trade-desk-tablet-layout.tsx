import type { ReactNode } from 'react';

import type { MessageKey } from '@phonara/i18n';

import {
  TRADE_DESK_TABLET_MAIN_GRID_CLASS,
  TRADE_DESK_TABLET_MAIN_GRID_TESTID,
  TRADE_DESK_TABLET_ROOT_CLASS,
  TRADE_DESK_TABLET_TABS_CLASS,
  TRADE_DESK_TABLET_TAB_IDS,
  type TradeDeskTabletTabId,
} from '@/domain/trade-mobile-layout-display-contract';
import {
  TRADE_DESK_CHART_SLOT_CLASS,
  TRADE_DESK_TICKET_SLOT_CLASS,
} from '@/domain/trade-ultra-layout-display-contract';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/product/primitives/tabs';
import { cn } from '@/product/primitives/lib/cn';

const TABLET_TAB_LABEL_KEYS: Record<TradeDeskTabletTabId, MessageKey> = {
  trade: 'trade.order.title',
  positions: 'trade.panel.positions',
  history: 'trade.panel.history',
};

export type TradeDeskTabletLayoutProps = {
  testId: string;
  t: (key: MessageKey) => string;
  chart: ReactNode;
  ticket: ReactNode;
  trade: ReactNode;
  positions: ReactNode;
  history: ReactNode;
  defaultTab?: TradeDeskTabletTabId;
  className?: string;
};

/** Tablet (768–1023) — chart + ticket 2-col header · trade|positions|history tabs below. */
export function TradeDeskTabletLayout({
  testId,
  t,
  chart,
  ticket,
  trade,
  positions,
  history,
  defaultTab = 'trade',
  className,
}: TradeDeskTabletLayoutProps) {
  return (
    <div
      className={cn(
        TRADE_DESK_TABLET_ROOT_CLASS,
        'hidden md:flex lg:hidden flex-col gap-4',
        className,
      )}
      data-testid={testId}
    >
      <div
        className={cn(TRADE_DESK_TABLET_MAIN_GRID_CLASS, 'min-h-0 grid')}
        data-testid={TRADE_DESK_TABLET_MAIN_GRID_TESTID}
      >
        <div className={TRADE_DESK_CHART_SLOT_CLASS}>{chart}</div>
        <div className={TRADE_DESK_TICKET_SLOT_CLASS}>{ticket}</div>
      </div>

      <div className={TRADE_DESK_TABLET_TABS_CLASS}>
        <Tabs defaultValue={defaultTab}>
          <TabsList className="grid w-full grid-cols-3" data-testid="trade-desk-tablet-tablist">
            {TRADE_DESK_TABLET_TAB_IDS.map((tabId) => (
              <TabsTrigger key={tabId} value={tabId} data-testid={`trade-desk-tablet-tab-${tabId}`}>
                {t(TABLET_TAB_LABEL_KEYS[tabId])}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="trade" data-testid="trade-desk-tablet-panel-trade">
            {trade}
          </TabsContent>
          <TabsContent value="positions" data-testid="trade-desk-tablet-panel-positions">
            {positions}
          </TabsContent>
          <TabsContent value="history" data-testid="trade-desk-tablet-panel-history">
            {history}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
