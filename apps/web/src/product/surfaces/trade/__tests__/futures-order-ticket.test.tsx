import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { FuturesDeskWire } from '@/features/trading/use-futures-desk-wire';
import { MarginModeSegment } from '@/features/trading/order-ticket/margin-mode-segment';
import { PositionModeFixedLabel } from '@/features/trading/order-ticket/position-mode-fixed-label';
import { PositionModeSegment } from '@/features/trading/order-ticket/position-mode-segment';
import { I18nProvider } from '@/product/i18n';
import { FuturesOrderTicket } from '@/product/surfaces/trade/futures-order-ticket';

vi.mock('@/features/trading/use-trade-fiat-hint', () => ({
  useTradeFiatHint: () => ({
    targetFiat: 'OFF',
    hintFor: () => ({
      displayOnly: true,
      disabled: true,
      formattedHint: '',
      targetFiat: 'OFF',
      asOf: '',
      stale: false,
      sourceCurrency: 'USDT',
    }),
    showDisclaimer: false,
  }),
}));

function makeWire(overrides: Partial<FuturesDeskWire> = {}): FuturesDeskWire {
  return {
    side: 'long',
    setSide: vi.fn(),
    marginCurrency: 'USDT',
    setMarginCurrency: vi.fn(),
    margin: '100',
    onMarginInput: vi.fn(),
    leverage: '10',
    setLeverage: vi.fn(),
    maxLeverageNum: 100,
    tpEnabled: false,
    setTpEnabled: vi.fn(),
    tpPrice: '',
    setTpPrice: vi.fn(),
    slEnabled: false,
    setSlEnabled: vi.fn(),
    slPrice: '',
    setSlPrice: vi.fn(),
    avail: '250.000000',
    phonAvail: '1000.000000',
    usdtAvail: '250.000000',
    phonBonusAvailableDisplay: '200.000000',
    phonRealAvailableDisplay: '800.000000',
    preview: null,
    busy: false,
    walletLoading: false,
    tradeBlocked: false,
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
    confirmOpen: false,
    setConfirmOpen: vi.fn(),
    submitOpen: vi.fn(),
    requestSubmitOpen: vi.fn(),
    orderType: 'market',
    setOrderType: vi.fn(),
    limitPrice: '',
    setLimitPrice: vi.fn(),
    stopPrice: '',
    setStopPrice: vi.fn(),
    orderPricesReady: true,
    marginMode: 'isolated',
    setMarginMode: vi.fn(),
    marginModeBusy: false,
    positionMode: 'one_way',
    setPositionMode: vi.fn(),
    positionModeBusy: false,
    reduceOnly: false,
    setReduceOnly: vi.fn(),
    crossMarginEnabled: false,
    earnVipTier: 'silver',
    t: (key) => String(key),
    ...overrides,
  } as FuturesDeskWire;
}

function renderTicket(wire = makeWire()) {
  return render(
    <I18nProvider>
      <FuturesOrderTicket wire={wire} />
    </I18nProvider>,
  );
}

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

describe('FuturesOrderTicket leverage control', () => {
  it('renders slider and OKX/Binance-style preset chips including max', () => {
    renderTicket();

    expect(screen.getByTestId('leverage-control')).toBeInTheDocument();
    expect(screen.getByTestId('leverage-slider')).toBeInTheDocument();
    expect(screen.getByTestId('leverage-preset-1')).toBeInTheDocument();
    expect(screen.getByTestId('leverage-preset-5')).toBeInTheDocument();
    expect(screen.getByTestId('leverage-preset-10')).toBeInTheDocument();
    expect(screen.getByTestId('leverage-preset-20')).toBeInTheDocument();
    expect(screen.getByTestId('leverage-preset-max')).toBeInTheDocument();
    expect(screen.getByTestId('leverage-value')).toHaveTextContent('10x');
  });

  it('calls setLeverage when a preset chip is clicked', () => {
    const setLeverage = vi.fn();
    renderTicket(makeWire({ setLeverage }));

    fireEvent.click(screen.getByTestId('leverage-preset-20'));
    expect(setLeverage).toHaveBeenCalledWith('20');
  });

  it('calls setLeverage with market max when max chip is clicked', () => {
    const setLeverage = vi.fn();
    renderTicket(makeWire({ setLeverage, maxLeverageNum: 25 }));

    fireEvent.click(screen.getByTestId('leverage-preset-max'));
    expect(setLeverage).toHaveBeenCalledWith('25');
  });

  it('hides preset chips above RPC max_leverage cap', () => {
    renderTicket(makeWire({ maxLeverageNum: 10, leverage: '5' }));

    expect(screen.getByTestId('leverage-preset-10')).toBeInTheDocument();
    expect(screen.queryByTestId('leverage-preset-20')).not.toBeInTheDocument();
  });

  it('disables market submit when preview is null and shows inline reason (Phase 1 PR-5)', () => {
    renderTicket(makeWire({ preview: null, orderType: 'market' }));

    expect(screen.getByTestId('futures-submit')).toBeDisabled();
    expect(screen.getByTestId('futures-submit-blocked-reason')).toHaveTextContent(
      'trade.submit.previewUnavailable',
    );
    expect(screen.queryByText('error.INSUFFICIENT_BALANCE')).not.toBeInTheDocument();
  });

  it('requires high-leverage risk acknowledgement before submit', () => {
    renderTicket(
      makeWire({
        isHighLeverage: true,
        riskAck: {
          acknowledged: false,
          acknowledge: vi.fn(),
          busy: false,
          error: null,
          loading: false,
        },
      }),
    );

    expect(screen.getByTestId('trading-risk-ack')).toBeInTheDocument();
    expect(screen.getByTestId('futures-submit')).toBeDisabled();
  });

  it('requires house-counterparty acknowledgement before submit (P2-D)', () => {
    renderTicket(
      makeWire({
        preview: {
          notional: '1000',
          openFee: '1',
          liquidationPrice: '0.5',
          quantity: '10',
        } as FuturesDeskWire['preview'],
        houseCounterpartyAck: {
          acknowledged: false,
          acknowledge: vi.fn(),
          busy: false,
          error: null,
          loading: false,
        },
      }),
    );

    expect(screen.getByTestId('house-counterparty-ack')).toBeInTheDocument();
    expect(screen.getByTestId('futures-submit')).toBeDisabled();
  });

  it('calls requestSubmitOpen when submit button is clicked', () => {
    const requestSubmitOpen = vi.fn();
    renderTicket(
      makeWire({
        requestSubmitOpen,
        preview: {
          notional: '1000',
          openFee: '1',
          liquidationPrice: '0.5',
          quantity: '10',
        } as FuturesDeskWire['preview'],
      }),
    );

    fireEvent.click(screen.getByTestId('futures-submit'));
    expect(requestSubmitOpen).toHaveBeenCalledTimes(1);
  });

  it('calls requestSubmitOpen when Enter is pressed on margin input (P3-E keyboard path)', () => {
    const requestSubmitOpen = vi.fn();
    renderTicket(
      makeWire({
        requestSubmitOpen,
        preview: {
          notional: '1000',
          openFee: '1',
          liquidationPrice: '0.5',
          quantity: '10',
        } as FuturesDeskWire['preview'],
      }),
    );

    fireEvent.keyDown(screen.getByTestId('futures-margin-input'), { key: 'Enter', code: 'Enter' });
    expect(requestSubmitOpen).toHaveBeenCalledTimes(1);
  });

  it('exposes logical tab-order anchors for desktop ticket (P3-E)', () => {
    renderTicket();
    expect(screen.getByTestId('futures-order-type-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('futures-margin-input')).toBeInTheDocument();
    expect(screen.getByTestId('futures-submit')).toBeInTheDocument();
  });
});

describe('FuturesOrderTicket density · §13.1.1', () => {
  it('renders USDT/PHON margin currency selector wired to p_margin_currency', () => {
    renderTicket();

    expect(screen.getByTestId('futures-margin-currency-selector')).toBeInTheDocument();
    expect(screen.getByTestId('margin-currency-usdt')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('margin-currency-phon')).toHaveAttribute('aria-pressed', 'false');
  });

  it('switches avail display when margin currency changes', () => {
    const setMarginCurrency = vi.fn();
    renderTicket(
      makeWire({
        marginCurrency: 'PHON',
        avail: '1000.000000',
        setMarginCurrency,
      }),
    );

    expect(screen.getByTestId('futures-ticket-avail')).toHaveTextContent('PHON');
    fireEvent.click(screen.getByTestId('margin-currency-usdt'));
    expect(setMarginCurrency).toHaveBeenCalledWith('USDT');
  });

  it('shows OKX-style balance percent chips', () => {
    renderTicket();

    expect(screen.getByTestId('order-ticket-balance-chips')).toBeInTheDocument();
    expect(screen.getByTestId('balance-percent-25')).toBeInTheDocument();
    expect(screen.getByTestId('balance-percent-50')).toBeInTheDocument();
    expect(screen.getByTestId('balance-percent-75')).toBeInTheDocument();
    expect(screen.getByTestId('balance-percent-100')).toBeInTheDocument();
  });

  it('calls onMarginInput when balance percent chip is clicked', () => {
    const onMarginInput = vi.fn();
    renderTicket(makeWire({ onMarginInput }));

    fireEvent.click(screen.getByTestId('balance-percent-50'));
    expect(onMarginInput).toHaveBeenCalledWith('125');
  });

  it('shows desk USDT and PHON balances', () => {
    renderTicket();

    const balances = screen.getByTestId('futures-desk-balances');
    expect(balances).toHaveTextContent('USDT');
    expect(balances).toHaveTextContent('PHON');
  });

  it('shows separate est fee · required margin · liq rows from preview', () => {
    renderTicket(
      makeWire({
        preview: {
          notional: '1000.000000',
          quantity: '0.015385',
          openFee: '0.600000',
          liquidationPrice: '58500.000000',
        },
      }),
    );

    expect(screen.getByTestId('futures-ticket-est-fee')).toHaveTextContent(/0\.6/);
    expect(screen.getByTestId('futures-ticket-est-liq')).toHaveTextContent(/58.?500/);
    expect(screen.getByTestId('futures-order-ticket-metrics')).toHaveTextContent(
      'trade.order.estRequired',
    );
  });

  it('shows VIP tier badge with HelpTip and keeps single est fee numeric row', () => {
    renderTicket(
      makeWire({
        preview: {
          notional: '1000.000000',
          quantity: '0.015385',
          openFee: '0.600000',
          liquidationPrice: '58500.000000',
        },
      }),
    );

    expect(screen.getByTestId('trade-tier-fee-badge')).toBeInTheDocument();
    expect(screen.getByTestId('trade-help-tip-tier_fee')).toBeInTheDocument();
    expect(screen.getAllByTestId('futures-ticket-est-fee')).toHaveLength(1);
  });
});

describe('FuturesOrderTicket position mode · margin mode · §13.1 · E21', () => {
  it('shows hedge / dual-side position mode toggle with HelpTip', () => {
    const setPositionMode = vi.fn();
    renderTicket(
      makeWire({
        positionMode: 'one_way',
        setPositionMode,
        positionModeBusy: false,
      }),
    );

    expect(screen.getByTestId('hedge-position-mode-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('position-mode-one-way')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('trade-help-tip-position_mode')).toBeInTheDocument();
    expect(screen.queryByTestId('position-mode-fixed-label')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('position-mode-hedge'));
    expect(setPositionMode).toHaveBeenCalledWith('hedge');
  });

  it('shows reduce-only checkbox for limit orders in advanced panel', () => {
    const setReduceOnly = vi.fn();
    renderTicket(makeWire({ orderType: 'limit', reduceOnly: false, setReduceOnly }));

    fireEvent.click(screen.getByText('trade.order.advanced'));

    expect(screen.getByTestId('futures-reduce-only-toggle')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('futures-reduce-only-checkbox'));
    expect(setReduceOnly).toHaveBeenCalledWith(true);
  });

  it('shows account-scoped margin mode segment in advanced panel', () => {
    const setMarginMode = vi.fn();
    renderTicket(makeWire({ setMarginMode }));

    fireEvent.click(screen.getByText('trade.order.advanced'));

    expect(screen.getByTestId('margin-mode-segment')).toBeInTheDocument();
    expect(screen.getByTestId('margin-mode-account-scoped-hint')).toHaveTextContent(
      'trade.order.marginMode.accountScoped',
    );
    expect(screen.getByTestId('trade-help-tip-margin_mode')).toBeInTheDocument();
    expect(screen.getByTestId('margin-mode-isolated')).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByTestId('margin-mode-isolated'));
    expect(setMarginMode).toHaveBeenCalledWith('isolated');
  });

  it('disables cross margin selector until launch flag is on', () => {
    renderTicket(makeWire({ crossMarginEnabled: false }));

    fireEvent.click(screen.getByText('trade.order.advanced'));

    expect(screen.getByTestId('margin-mode-cross')).toBeDisabled();
    expect(screen.getByTestId('cross-margin-disabled-reason')).toHaveTextContent(
      'trade.margin.crossDisabled',
    );
    expect(screen.getByTestId('cross-margin-disabled-reason')).toHaveAttribute(
      'data-canary-wave',
      'phase4-trade-cross-margin',
    );
  });

  it('enables cross margin selector when feature_cross_margin_enabled is on', () => {
    const setMarginMode = vi.fn();
    renderTicket(makeWire({ crossMarginEnabled: true, setMarginMode }));

    fireEvent.click(screen.getByText('trade.order.advanced'));

    const crossButton = screen.getByTestId('margin-mode-cross');
    expect(crossButton).not.toBeDisabled();
    expect(screen.queryByTestId('cross-margin-disabled-reason')).not.toBeInTheDocument();

    fireEvent.click(crossButton);
    expect(setMarginMode).toHaveBeenCalledWith('cross');
  });

  it('shows entry TP/SL defer hint for limit orders in advanced panel', () => {
    renderTicket(makeWire({ orderType: 'limit' }));

    fireEvent.click(screen.getByText('trade.order.advanced'));
    expect(screen.getByTestId('futures-entry-tpsl-defer-hint')).toHaveTextContent(
      'trade.order.entryTpSlDeferHint',
    );
    expect(screen.queryByLabelText('trade.order.tp')).not.toBeInTheDocument();
  });
});

describe('PositionModeFixedLabel · PositionModeSegment · MarginModeSegment units', () => {
  it('PositionModeFixedLabel hides when tradeParityLive unlocks hedge toggle', () => {
    render(
      <I18nProvider>
        <PositionModeFixedLabel t={(key) => String(key)} />
      </I18nProvider>,
    );

    expect(screen.queryByTestId('position-mode-fixed-label')).not.toBeInTheDocument();
  });

  it('PositionModeSegment renders hedge toggle when tradeParityLive', () => {
    const setPositionMode = vi.fn();
    render(
      <I18nProvider>
        <PositionModeSegment
          positionMode="one_way"
          setPositionMode={setPositionMode}
          positionModeBusy={false}
          t={(key) => String(key)}
        />
      </I18nProvider>,
    );

    expect(screen.getByTestId('hedge-position-mode-toggle')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('position-mode-hedge'));
    expect(setPositionMode).toHaveBeenCalledWith('hedge');
  });

  it('MarginModeSegment wires isolated selector and account hint', () => {
    const setMarginMode = vi.fn();
    render(
      <I18nProvider>
        <MarginModeSegment
          marginMode="isolated"
          setMarginMode={setMarginMode}
          marginModeBusy={false}
          crossMarginEnabled={false}
          t={(key) => String(key)}
        />
      </I18nProvider>,
    );

    expect(screen.getByTestId('margin-mode-account-scoped-hint')).toBeInTheDocument();
    expect(screen.getByTestId('cross-margin-disabled-reason')).toHaveTextContent(
      'trade.margin.crossDisabled',
    );
    fireEvent.click(screen.getByTestId('margin-mode-isolated'));
    expect(setMarginMode).toHaveBeenCalledWith('isolated');
  });

  it('MarginModeSegment enables cross selector when canary flag is on', () => {
    const setMarginMode = vi.fn();
    render(
      <I18nProvider>
        <MarginModeSegment
          marginMode="isolated"
          setMarginMode={setMarginMode}
          marginModeBusy={false}
          crossMarginEnabled={true}
          t={(key) => String(key)}
        />
      </I18nProvider>,
    );

    expect(screen.queryByTestId('cross-margin-disabled-reason')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('margin-mode-cross'));
    expect(setMarginMode).toHaveBeenCalledWith('cross');
  });
});
