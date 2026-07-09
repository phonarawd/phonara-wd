import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import {
  FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
  P4_PAGE_WALLET_FIAT_HINT_TODO,
  toFiatHint,
} from '@/domain/fiat-reference-display-contract';
import { I18nProvider } from '@/product/i18n';

import { WalletMoneyWithFiatHint } from '../wallet-money-with-fiat-hint';

const SAMPLE_SNAPSHOT = {
  displayOnly: FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
  rate: '1450',
  capturedAt: '2026-07-06T10:00:00.000Z',
  source: 'exchange_rate_snapshots:PHON/KRW',
  stale: false,
} as const;

function renderWithI18n(ui: ReactElement) {
  window.localStorage.setItem('phonara.locale', 'ko');
  return render(<I18nProvider>{ui}</I18nProvider>);
}

describe('wallet-money-with-fiat-hint §13.1.4 Fiat#6', () => {
  it('registers Fiat#6 surface todo', () => {
    expect(P4_PAGE_WALLET_FIAT_HINT_TODO).toBe('p4-page-wallet-fiat-hint');
  });

  it('renders secondary fiat hint under primary settlement MoneyDisplay', () => {
    const fiatHint = toFiatHint('10', 'PHON', 'KRW', SAMPLE_SNAPSHOT);

    renderWithI18n(
      <WalletMoneyWithFiatHint
        amount="10.000000"
        currency="PHON"
        showCurrency
        fiatHint={fiatHint}
      />,
    );

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('PHON')).toBeInTheDocument();
    expect(document.querySelector('[data-wallet-fiat-hint]')).not.toBeNull();
    expect(document.querySelector('[data-fiat-hint]')).not.toBeNull();
  });

  it('falls back to MoneyDisplay when hint is disabled', () => {
    renderWithI18n(
      <WalletMoneyWithFiatHint
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

    expect(document.querySelector('[data-wallet-fiat-hint]')).toBeNull();
    expect(document.querySelector('[data-fiat-hint]')).toBeNull();
  });
});
