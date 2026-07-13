import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import {
  FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
  P10_CASINO_FIAT_HINT_SESSION_LOCK_TODO,
  toFiatHint,
} from '@/domain/fiat-reference-display-contract';
import { I18nProvider } from '@/product/i18n';
import { CasinoMoneyWithFiatHint } from '@/product/surfaces/games/casino-money-with-fiat-hint';

const useCasinoFiatHintMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/casino/use-casino-fiat-hint', () => ({
  useCasinoFiatHint: useCasinoFiatHintMock,
}));

const SAMPLE_SNAPSHOT = {
  displayOnly: FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
  rate: '1400',
  capturedAt: '2026-07-11T01:00:00.000Z',
  source: 'exchange_rate_snapshots:USDT/KRW',
  stale: false,
};

function wrap(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <I18nProvider>{ui}</I18nProvider>
    </QueryClientProvider>,
  );
}

describe('CasinoMoneyWithFiatHint Fiat#11', () => {
  beforeEach(() => {
    window.localStorage.setItem('phonara.locale', 'ko');
    useCasinoFiatHintMock.mockReturnValue({
      targetFiat: 'KRW',
      sessionLocked: true,
      lockedAt: '2026-07-11T01:00:00.000Z',
      hintFor: (amount: string, currency: string) =>
        toFiatHint(amount, currency, 'KRW', SAMPLE_SNAPSHOT),
      lockSession: vi.fn(),
      unlockSession: vi.fn(),
      showDisclaimer: true,
    });
  });

  it('wires live fiat hint from useCasinoFiatHint when fiatHint prop is omitted', () => {
    wrap(<CasinoMoneyWithFiatHint amount="10.000000" currency="USDT" showCurrency role="stake" />);

    expect(screen.getByText(/≈ ₩/)).toBeInTheDocument();
    const root = document.querySelector('[data-casino-fiat-hint]');
    expect(root).toHaveAttribute('data-fiat-hint-todo', P10_CASINO_FIAT_HINT_SESSION_LOCK_TODO);
    expect(root).toHaveAttribute('data-casino-fiat-session-locked', 'true');
    expect(root).toHaveAttribute('data-casino-fiat-hint-role', 'stake');
  });

  it('falls back to MoneyDisplay when hint is disabled', () => {
    wrap(
      <CasinoMoneyWithFiatHint
        amount="10.000000"
        currency="USDT"
        showCurrency
        fiatHint={{
          displayOnly: FIAT_REFERENCE_DISPLAY_ONLY_BOUNDARY,
          formattedHint: '',
          targetFiat: 'OFF',
          asOf: '',
          stale: false,
          disabled: true,
          sourceCurrency: 'USDT',
        }}
      />,
    );

    expect(document.querySelector('[data-casino-fiat-hint]')).toBeNull();
    expect(screen.getByText(/10/)).toBeInTheDocument();
  });
});
