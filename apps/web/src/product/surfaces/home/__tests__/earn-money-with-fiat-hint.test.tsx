import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import {
  FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
  P7_EARN_FIAT_HINT_CO_PRIMARY_TODO,
  toFiatHint,
} from '@/domain/fiat-reference-display-contract';
import { I18nProvider } from '@/product/i18n';

import { EarnMoneyWithFiatHint } from '../earn-money-with-fiat-hint';

const SAMPLE_SNAPSHOT = {
  displayOnly: FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
  rate: '1400',
  capturedAt: '2026-07-06T10:00:00.000Z',
  source: 'exchange_rate_snapshots:PHON/KRW',
  stale: false,
} as const;

function renderWithI18n(ui: ReactElement) {
  window.localStorage.setItem('phonara.locale', 'ko');
  return render(<I18nProvider>{ui}</I18nProvider>);
}

describe('earn-money-with-fiat-hint §13.1.4 Fiat#8', () => {
  it('registers Fiat#8 surface todo', () => {
    expect(P7_EARN_FIAT_HINT_CO_PRIMARY_TODO).toBe('p7-earn-fiat-hint-co-primary');
  });

  it('renders co-primary fiat hint beside PHON reward', () => {
    const fiatHint = toFiatHint('25.000000', 'PHON', 'KRW', SAMPLE_SNAPSHOT);

    renderWithI18n(
      <EarnMoneyWithFiatHint
        amount="25.000000"
        currency="PHON"
        signed
        showCurrency
        fiatHint={fiatHint}
      />,
    );

    expect(document.querySelector('[data-earn-fiat-hint]')).not.toBeNull();
    expect(document.querySelector('[data-fiat-hint]')).not.toBeNull();
    expect(screen.getByText('PHON')).toBeInTheDocument();
  });

  it('falls back to MoneyDisplay when hint is disabled', () => {
    renderWithI18n(
      <EarnMoneyWithFiatHint
        amount="25.000000"
        currency="PHON"
        signed
        showCurrency
        fiatHint={{
          displayOnly: true,
          disabled: true,
          formattedHint: '',
          targetFiat: 'KRW',
          asOf: '',
          stale: false,
          sourceCurrency: 'PHON',
        }}
      />,
    );

    expect(document.querySelector('[data-earn-fiat-hint]')).toBeNull();
    expect(document.querySelector('[data-fiat-hint]')).toBeNull();
  });
});
