import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { SpotDeskWire } from '@/features/trading/use-spot-desk-wire';
import { I18nProvider } from '@/product/i18n';
import { SpotOrderTicket } from '@/product/surfaces/trade/spot-order-ticket';

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

function makeWire(overrides: Partial<SpotDeskWire> = {}): SpotDeskWire {
  return {
    side: 'buy',
    setSide: vi.fn(),
    amount: '10',
    onAmountInput: vi.fn(),
    availBalance: { amount: '250.000000', currency: 'USDT' },
    estimate: '990.000000',
    estimateCurrency: 'PHON',
    estimateFee: '1.000000',
    estimateFeeCurrency: 'PHON',
    baseLabel: 'PHON',
    quoteLabel: 'USDT',
    buyStakeCurrency: 'USDT',
    setBuyStakeCurrency: vi.fn(),
    canSelectPhonBuyStake: false,
    busy: false,
    tradeBlocked: false,
    earnVipTier: 'gold',
    confirmOpen: false,
    setConfirmOpen: vi.fn(),
    canConfirm: true,
    confirmNotice: undefined,
    submit: vi.fn(),
    requestSubmit: vi.fn(),
    orderType: 'market',
    setOrderType: vi.fn(),
    limitPrice: '',
    setLimitPrice: vi.fn(),
    onLimitPriceInput: vi.fn(),
    stopPrice: '',
    setStopPrice: vi.fn(),
    onStopPriceInput: vi.fn(),
    orderPricesReady: true,
    spotCapabilities: {
      limitOrders: true,
      stopOrders: true,
      openOrdersDock: true,
      cancelOpenOrders: true,
    },
    houseCounterpartyAck: {
      acknowledged: true,
      acknowledge: vi.fn(),
      busy: false,
      error: null,
      loading: false,
    },
    price: '0.01',
    t: (key) => String(key),
    ...overrides,
  } as SpotDeskWire;
}

function renderTicket(wire = makeWire()) {
  return render(
    <I18nProvider>
      <SpotOrderTicket wire={wire} />
    </I18nProvider>,
  );
}

describe('SpotOrderTicket density', () => {
  it('renders balance percent chips and separate est receive / est fee rows', () => {
    renderTicket();

    expect(screen.getByTestId('order-ticket-balance-chips')).toBeInTheDocument();
    expect(screen.getByTestId('spot-ticket-est-receive')).toBeInTheDocument();
    expect(screen.getByTestId('spot-ticket-est-fee')).toBeInTheDocument();
    expect(screen.getByTestId('spot-order-ticket-metrics')).toHaveTextContent(
      'confirm.row.estReceive',
    );
    expect(screen.getByTestId('spot-order-ticket-metrics')).toHaveTextContent('trade.order.estFee');
  });

  it('shows VIP tier badge with HelpTip and keeps single est fee numeric row', () => {
    renderTicket();

    expect(screen.getByTestId('trade-tier-fee-badge')).toBeInTheDocument();
    expect(screen.getByTestId('trade-help-tip-tier_fee')).toBeInTheDocument();
    expect(screen.getAllByTestId('spot-ticket-est-fee')).toHaveLength(1);
  });

  it('calls onAmountInput when balance percent chip is clicked', () => {
    const onAmountInput = vi.fn();
    renderTicket(makeWire({ onAmountInput }));

    fireEvent.click(screen.getByTestId('balance-percent-25'));
    expect(onAmountInput).toHaveBeenCalledWith('62.5');
  });

  it('calls requestSubmit when submit button is clicked', () => {
    const requestSubmit = vi.fn();
    renderTicket(makeWire({ requestSubmit }));

    fireEvent.click(screen.getByTestId('spot-submit'));
    expect(requestSubmit).toHaveBeenCalledTimes(1);
  });

  it('calls requestSubmit when Enter is pressed on amount input (P3-E keyboard path)', () => {
    const requestSubmit = vi.fn();
    renderTicket(makeWire({ requestSubmit }));

    fireEvent.keyDown(screen.getByTestId('spot-amount-input'), { key: 'Enter', code: 'Enter' });
    expect(requestSubmit).toHaveBeenCalledTimes(1);
  });

  it('does not submit on Enter when ticket is disabled', () => {
    const requestSubmit = vi.fn();
    renderTicket(
      makeWire({
        requestSubmit,
        tradeBlocked: true,
        submitBlockedReason: 'trade.dataStatus.staleDescription',
      }),
    );

    fireEvent.keyDown(screen.getByTestId('spot-amount-input'), { key: 'Enter', code: 'Enter' });
    expect(requestSubmit).not.toHaveBeenCalled();
  });

  it('exposes logical tab-order anchors for desktop ticket (P3-E)', () => {
    renderTicket();
    expect(screen.getByTestId('spot-order-type-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('spot-amount-input')).toBeInTheDocument();
    expect(screen.getByTestId('spot-submit')).toBeInTheDocument();
  });

  it('shows inline submit blocked reason when stale (Phase 1 PR-4)', () => {
    renderTicket(
      makeWire({
        tradeBlocked: true,
        submitBlockedReason: 'trade.dataStatus.staleDescription',
      }),
    );

    expect(screen.getByTestId('spot-submit')).toBeDisabled();
    expect(screen.getByTestId('spot-submit-blocked-reason')).toHaveTextContent(
      'trade.dataStatus.staleDescription',
    );
  });

  it('requires house-counterparty acknowledgement before submit (P2-D)', () => {
    renderTicket(
      makeWire({
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
    expect(screen.getByTestId('spot-submit')).toBeDisabled();
  });

  it('renders spend currency selector on buy side', () => {
    renderTicket(makeWire({ side: 'buy', canSelectPhonBuyStake: true }));

    expect(screen.getByTestId('spot-buy-stake-currency-selector')).toBeInTheDocument();
    expect(screen.getByText('사용 코인')).toBeInTheDocument();
  });
});
