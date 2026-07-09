import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
  P9_TRADE_FIAT_HINT_WIRE_TODO,
  toFiatHint,
} from '@/domain/fiat-reference-display-contract';
import { P2_FIAT_HINT_WIRE_TODO } from '@/domain/trade-desk-fiat-hint-wire-display-contract';
import { I18nProvider } from '@/product/i18n';

const useTradeFiatHintMock = vi.hoisted(() =>
  vi.fn(() => ({
    targetFiat: 'KRW' as const,
    showDisclaimer: true,
    hintFor: () =>
      toFiatHint('100', 'USDT', 'KRW', {
        displayOnly: FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
        rate: '1400',
        capturedAt: '2026-07-06T10:00:00.000Z',
        source: 'exchange_rate_snapshots:USDT/KRW',
        stale: false,
      }),
  })),
);

vi.mock('@/features/trading/use-trade-fiat-hint', () => ({
  useTradeFiatHint: useTradeFiatHintMock,
}));

import { TradeMoneyWithFiatHint } from '../trade-money-with-fiat-hint';

const SAMPLE_SNAPSHOT = {
  displayOnly: FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
  rate: '1400',
  capturedAt: '2026-07-06T10:00:00.000Z',
  source: 'exchange_rate_snapshots:USDT/KRW',
  stale: false,
} as const;

function renderWithI18n(ui: ReactElement) {
  window.localStorage.setItem('phonara.locale', 'ko');
  return render(<I18nProvider>{ui}</I18nProvider>);
}

describe('trade-money-with-fiat-hint §13.1.4 Fiat#7', () => {
  it('registers Fiat#7 surface todo and P2-E wire todo', () => {
    expect(P9_TRADE_FIAT_HINT_WIRE_TODO).toBe('p9-trade-fiat-hint-wire');
    expect(P2_FIAT_HINT_WIRE_TODO).toBe('p2-fiat-hint-wire');
  });

  it('wires live fiat hint from useTradeFiatHint when fiatHint prop is omitted (P2-E)', () => {
    renderWithI18n(<TradeMoneyWithFiatHint amount="100.000000" currency="USDT" showCurrency />);

    expect(useTradeFiatHintMock).toHaveBeenCalled();
    expect(document.querySelector('[data-trade-fiat-hint]')).not.toBeNull();
    expect(document.querySelector('[data-fiat-hint]')).not.toBeNull();
  });

  it('renders secondary fiat hint under primary settlement MoneyDisplay', () => {
    const fiatHint = toFiatHint('100', 'USDT', 'KRW', SAMPLE_SNAPSHOT);

    renderWithI18n(
      <TradeMoneyWithFiatHint
        amount="100.000000"
        currency="USDT"
        showCurrency
        fiatHint={fiatHint}
      />,
    );

    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('USDT')).toBeInTheDocument();
    expect(document.querySelector('[data-trade-fiat-hint]')).not.toBeNull();
    expect(document.querySelector('[data-fiat-hint]')).not.toBeNull();
  });

  it('falls back to MoneyDisplay when hint is disabled', () => {
    renderWithI18n(
      <TradeMoneyWithFiatHint
        amount="50000"
        currency="KRW"
        showCurrency
        fiatHint={{
          displayOnly: true,
          disabled: true,
          formattedHint: '',
          targetFiat: 'KRW',
          asOf: '',
          stale: false,
          sourceCurrency: 'KRW',
        }}
      />,
    );

    expect(document.querySelector('[data-trade-fiat-hint]')).toBeNull();
    expect(document.querySelector('[data-fiat-hint]')).toBeNull();
  });
});
