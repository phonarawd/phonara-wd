import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
  P10_SPORTS_FIAT_HINT_WIRE_TODO,
  toFiatHint,
} from '@/domain/fiat-reference-display-contract';
import { I18nProvider } from '@/product/i18n';

const useSportsFiatHintMock = vi.hoisted(() =>
  vi.fn(() => ({
    targetFiat: 'KRW' as const,
    showDisclaimer: true,
    hintFor: (amount: string | null | undefined) => {
      if (!amount) {
        return {
          displayOnly: FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
          disabled: true,
          formattedHint: '',
          targetFiat: 'KRW' as const,
          asOf: '',
          stale: false,
          sourceCurrency: 'USDT',
        };
      }
      return toFiatHint(amount, 'USDT', 'KRW', {
        displayOnly: FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
        rate: '1400',
        capturedAt: '2026-07-10T10:00:00.000Z',
        source: 'exchange_rate_snapshots:USDT/KRW',
        stale: false,
      });
    },
  })),
);

vi.mock('@/features/sports/use-sports-fiat-hint', () => ({
  useSportsFiatHint: useSportsFiatHintMock,
}));

import { SportsMoneyWithFiatHint } from '../sports-money-with-fiat-hint';

const SAMPLE_SNAPSHOT = {
  displayOnly: FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
  rate: '1400',
  capturedAt: '2026-07-10T10:00:00.000Z',
  source: 'exchange_rate_snapshots:USDT/KRW',
  stale: false,
} as const;

function renderWithI18n(ui: ReactElement) {
  window.localStorage.setItem('phonara.locale', 'ko');
  return render(<I18nProvider>{ui}</I18nProvider>);
}

describe('sports-money-with-fiat-hint §13.1.4 Fiat#10', () => {
  it('registers Fiat#10 surface todo', () => {
    expect(P10_SPORTS_FIAT_HINT_WIRE_TODO).toBe('p10-sports-fiat-hint-wire');
  });

  it('wires live fiat hint from useSportsFiatHint when fiatHint prop is omitted', () => {
    renderWithI18n(
      <SportsMoneyWithFiatHint amount="10.000000" currency="USDT" showCurrency role="stake" />,
    );

    expect(useSportsFiatHintMock).toHaveBeenCalled();
    expect(document.querySelector('[data-sports-fiat-hint]')).not.toBeNull();
    expect(document.querySelector('[data-sports-fiat-hint-role="stake"]')).not.toBeNull();
    expect(document.querySelector('[data-fiat-hint]')).not.toBeNull();
  });

  it('renders secondary fiat hint under primary settlement MoneyDisplay', () => {
    const fiatHint = toFiatHint('19.50', 'USDT', 'KRW', SAMPLE_SNAPSHOT);

    renderWithI18n(
      <SportsMoneyWithFiatHint
        amount="19.50"
        currency="USDT"
        showCurrency
        role="potential_return"
        fiatHint={fiatHint}
      />,
    );

    expect(screen.getByText('19.5')).toBeInTheDocument();
    expect(
      document.querySelector('[data-sports-fiat-hint-role="potential_return"]'),
    ).not.toBeNull();
    expect(document.querySelector('[data-fiat-hint]')).not.toBeNull();
  });

  it('falls back to MoneyDisplay when hint is disabled', () => {
    renderWithI18n(
      <SportsMoneyWithFiatHint
        amount="10"
        currency="USDT"
        showCurrency
        role="potential_return"
        fiatHint={{
          displayOnly: true,
          disabled: true,
          formattedHint: '',
          targetFiat: 'KRW',
          asOf: '',
          stale: false,
          sourceCurrency: 'USDT',
        }}
      />,
    );

    expect(document.querySelector('[data-sports-fiat-hint]')).toBeNull();
    expect(document.querySelector('[data-fiat-hint]')).toBeNull();
  });
});
