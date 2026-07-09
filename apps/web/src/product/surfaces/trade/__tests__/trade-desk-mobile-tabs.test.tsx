import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { MessageKey } from '@phonara/i18n';

import type { FuturesDeskWire } from '@/features/trading/use-futures-desk-wire';
import type { SpotDeskWire } from '@/features/trading/use-spot-desk-wire';
import { I18nProvider } from '@/product/i18n';
import {
  TradeDeskMobileTabs,
  TradeDeskMobileTradeStack,
} from '@/product/surfaces/trade/trade-desk-mobile-tabs';
import {
  FuturesMobileStickyCta,
  SpotMobileStickyCta,
} from '@/product/surfaces/trade/trade-desk-mobile-sticky-cta';
import {
  TRADE_DESK_MOBILE_NARROW_SIGNOFF_WIDTH_PX,
  TRADE_DESK_MOBILE_SWIPE_SURFACE_TESTID,
  TRADE_DESK_MOBILE_TAB_IDS,
  TRADE_DESK_MOBILE_TAB_LABEL_CLASS,
  TRADE_DESK_MOBILE_TABLIST_CLASS,
  TRADE_DESK_MOBILE_TRADE_SUBTAB_IDS,
} from '@/domain/trade-mobile-layout-display-contract';

function ensurePointerEventPolyfill() {
  if (typeof globalThis.PointerEvent !== 'undefined') return;

  class PointerEventPolyfill extends MouseEvent {
    readonly pointerId: number;
    readonly pointerType: string;

    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
      this.pointerType = params.pointerType ?? 'mouse';
    }
  }

  vi.stubGlobal('PointerEvent', PointerEventPolyfill);
}

function dispatchPointer(
  target: Element,
  type: 'pointerdown' | 'pointermove' | 'pointerup',
  clientX: number,
) {
  ensurePointerEventPolyfill();
  const init = { clientX, pointerId: 1, pointerType: 'touch' as const };
  if (type === 'pointerdown') fireEvent.pointerDown(target, init);
  if (type === 'pointermove') fireEvent.pointerMove(target, init);
  if (type === 'pointerup') fireEvent.pointerUp(target, init);
}

function renderTabs(
  defaultTab: 'chart' | 'trade' | 'positions' | 'history' = 'chart',
  t: (key: MessageKey) => string = (key) => String(key),
) {
  const tradeStack = (
    <TradeDeskMobileTradeStack
      t={(key) => String(key)}
      orderTicket={<div data-testid="mobile-trade-slot">trade</div>}
      book={<div data-testid="mobile-book-slot">book</div>}
      stickyCta={
        <button type="button" data-testid="mobile-sticky-submit">
          submit
        </button>
      }
    />
  );

  return render(
    <I18nProvider>
      <TradeDeskMobileTabs
        testId="trade-desk-mobile-tabs-test"
        t={t}
        defaultTab={defaultTab}
        chart={<div data-testid="mobile-chart-slot">chart</div>}
        trade={tradeStack}
        positions={<div data-testid="mobile-positions-slot">positions</div>}
        history={<div data-testid="mobile-history-slot">history</div>}
      />
    </I18nProvider>,
  );
}

describe('TradeDeskMobileTabs', () => {
  it('renders 4 mobile tabs with md:hidden shell (<768 only)', () => {
    renderTabs();

    const root = screen.getByTestId('trade-desk-mobile-tabs-test');
    expect(root).toHaveClass('trade-desk-mobile-tabs');
    expect(root).toHaveClass('md:hidden');

    expect(screen.getByTestId('trade-desk-mobile-tablist').children).toHaveLength(
      TRADE_DESK_MOBILE_TAB_IDS.length,
    );
    for (const tabId of TRADE_DESK_MOBILE_TAB_IDS) {
      expect(screen.getByTestId(`trade-desk-mobile-tab-${tabId}`)).toBeInTheDocument();
    }
  });

  it('uses icon + short labels with 44px touch targets at 375px (P2-B)', () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: TRADE_DESK_MOBILE_NARROW_SIGNOFF_WIDTH_PX,
    });
    renderTabs('chart', (key) => {
      const shortLabels: Partial<Record<MessageKey, string>> = {
        'trade.mobile.tab.chart': '차트',
        'trade.mobile.tab.trade': '주문',
        'trade.mobile.tab.positions': '포지션',
        'trade.mobile.tab.history': '내역',
        'trade.chartTitle': '실시간 가격 차트',
        'trade.order.title': '주문',
        'trade.panel.positions': '포지션',
        'trade.panel.history': '체결 내역',
      };
      return shortLabels[key] ?? String(key);
    });

    const tablist = screen.getByTestId('trade-desk-mobile-tablist');
    expect(tablist).toHaveClass(TRADE_DESK_MOBILE_TABLIST_CLASS);

    for (const tabId of TRADE_DESK_MOBILE_TAB_IDS) {
      const tab = screen.getByTestId(`trade-desk-mobile-tab-${tabId}`);
      expect(tab.querySelector('[data-testid="trade-desk-mobile-tab-icon"]')).toBeInTheDocument();
      const label = screen.getByTestId(`trade-desk-mobile-tab-label-${tabId}`);
      expect(label).toHaveClass(TRADE_DESK_MOBILE_TAB_LABEL_CLASS);
      expect(label.textContent?.length ?? 0).toBeLessThanOrEqual(4);
    }
  });

  it('swipes chart to trade on horizontal pointer gesture (P2-B)', () => {
    renderTabs('chart');

    const surface = screen.getByTestId(TRADE_DESK_MOBILE_SWIPE_SURFACE_TESTID);
    dispatchPointer(surface, 'pointerdown', 220);
    dispatchPointer(surface, 'pointermove', 120);
    dispatchPointer(surface, 'pointerup', 120);

    expect(screen.getByTestId('trade-desk-mobile-tab-trade')).toHaveAttribute(
      'data-state',
      'active',
    );
  });

  it('swipes trade to chart on horizontal pointer gesture (P2-B)', () => {
    renderTabs('trade');

    const surface = screen.getByTestId(TRADE_DESK_MOBILE_SWIPE_SURFACE_TESTID);
    dispatchPointer(surface, 'pointerdown', 120);
    dispatchPointer(surface, 'pointermove', 220);
    dispatchPointer(surface, 'pointerup', 220);

    expect(screen.getByTestId('trade-desk-mobile-tab-chart')).toHaveAttribute(
      'data-state',
      'active',
    );
  });

  it('shows trade sticky CTA when trade tab is active', () => {
    renderTabs('trade');
    expect(screen.getByTestId('trade-desk-mobile-sticky-cta')).toBeVisible();
    expect(screen.getByTestId('mobile-sticky-submit')).toBeVisible();
  });

  it('does not show trade sticky CTA on chart tab', () => {
    renderTabs('chart');
    expect(screen.queryByTestId('trade-desk-mobile-sticky-cta')).not.toBeInTheDocument();
  });
});

describe('TradeDeskMobileTradeStack', () => {
  it('renders order|book subtabs inside trade stack', () => {
    renderTabs('trade');

    expect(screen.getByTestId('trade-desk-mobile-trade-stack')).toHaveClass(
      'trade-desk-mobile-trade-stack',
    );
    expect(screen.getByTestId('trade-desk-mobile-trade-subtablist').children).toHaveLength(
      TRADE_DESK_MOBILE_TRADE_SUBTAB_IDS.length,
    );
    for (const subtabId of TRADE_DESK_MOBILE_TRADE_SUBTAB_IDS) {
      expect(screen.getByTestId(`trade-desk-mobile-trade-subtab-${subtabId}`)).toBeInTheDocument();
    }
  });
});

function makeSpotStickyWire(overrides: Partial<SpotDeskWire> = {}): SpotDeskWire {
  return {
    side: 'buy',
    baseLabel: 'PHON',
    busy: false,
    tradeBlocked: false,
    estimate: '80',
    orderType: 'market',
    orderPricesReady: true,
    submitBlockedReason: null,
    insufficientAvail: false,
    houseCounterpartyAck: {
      acknowledged: true,
      acknowledge: vi.fn(),
      busy: false,
      error: null,
      loading: false,
    },
    requestSubmit: vi.fn(),
    t: (key) => String(key),
    ...overrides,
  } as SpotDeskWire;
}

function makeFuturesStickyWire(overrides: Partial<FuturesDeskWire> = {}): FuturesDeskWire {
  return {
    side: 'long',
    margin: '100',
    preview: {
      openFee: '1.000000',
      notional: '1000.000000',
      liquidationPrice: '0.100000',
      marginRequired: '100.000000',
    },
    busy: false,
    walletLoading: false,
    tradeBlocked: false,
    submitBlockedReason: null,
    isHighLeverage: false,
    riskAck: {
      acknowledged: true,
      acknowledge: vi.fn(),
      busy: false,
      error: null,
      loading: false,
    },
    houseCounterpartyAck: {
      acknowledged: true,
      acknowledge: vi.fn(),
      busy: false,
      error: null,
      loading: false,
    },
    orderType: 'market',
    orderPricesReady: true,
    marginModeBusy: false,
    avail: '250.000000',
    requestSubmitOpen: vi.fn(),
    t: (key) => String(key),
    ...overrides,
  } as FuturesDeskWire;
}

describe('TradeDeskMobileStickyCta disabled reason (P0-3)', () => {
  it('shows insufficient balance reason above spot mobile sticky CTA', () => {
    render(
      <I18nProvider>
        <SpotMobileStickyCta
          wire={makeSpotStickyWire({
            insufficientAvail: true,
          })}
        />
      </I18nProvider>,
    );

    expect(screen.getByTestId('spot-mobile-sticky-submit')).toBeDisabled();
    expect(screen.getByTestId('spot-mobile-sticky-submit')).toHaveAttribute(
      'data-disabled-visual',
      'true',
    );
    expect(screen.getByTestId('spot-mobile-sticky-submit-reason')).toHaveTextContent(
      'error.INSUFFICIENT_BALANCE',
    );
  });

  it('shows tradeBlocked reason above spot mobile sticky CTA', () => {
    render(
      <I18nProvider>
        <SpotMobileStickyCta
          wire={makeSpotStickyWire({
            tradeBlocked: true,
            submitBlockedReason: 'trade.dataStatus.staleDescription',
          })}
        />
      </I18nProvider>,
    );

    expect(screen.getByTestId('spot-mobile-sticky-submit')).toBeDisabled();
    expect(screen.getByTestId('spot-mobile-sticky-submit-reason')).toHaveTextContent(
      'trade.dataStatus.staleDescription',
    );
  });

  it('shows insufficient balance reason above futures mobile sticky CTA', () => {
    render(
      <I18nProvider>
        <FuturesMobileStickyCta
          wire={makeFuturesStickyWire({
            avail: '50.000000',
            margin: '100',
            preview: {
              openFee: '1.000000',
              notional: '1000.000000',
              liquidationPrice: '0.100000',
              marginRequired: '100.000000',
            },
          })}
        />
      </I18nProvider>,
    );

    expect(screen.getByTestId('futures-mobile-sticky-submit')).toBeDisabled();
    expect(screen.getByTestId('futures-mobile-sticky-submit-reason')).toHaveTextContent(
      'error.INSUFFICIENT_BALANCE',
    );
  });

  it('shows preview-unavailable reason above futures mobile sticky CTA', () => {
    render(
      <I18nProvider>
        <FuturesMobileStickyCta
          wire={makeFuturesStickyWire({
            preview: null,
            orderType: 'market',
          })}
        />
      </I18nProvider>,
    );

    expect(screen.getByTestId('futures-mobile-sticky-submit')).toBeDisabled();
    expect(screen.getByTestId('futures-mobile-sticky-submit-reason')).toHaveTextContent(
      'trade.submit.previewUnavailable',
    );
  });
});
