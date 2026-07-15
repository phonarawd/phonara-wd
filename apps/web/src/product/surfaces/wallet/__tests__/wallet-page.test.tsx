import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { WalletPageControllerView } from '@/features/wallet/use-wallet-page-controller';
import { I18nProvider } from '@/product/i18n';
import { WalletPage } from '@/product/surfaces/wallet/wallet-page';

const useWalletPageControllerMock = vi.hoisted(() => vi.fn());
const useWalletFiatHintMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/wallet/use-wallet-page-controller', () => ({
  useWalletPageController: useWalletPageControllerMock,
}));

vi.mock('@/features/wallet/use-wallet-fiat-hint', () => ({
  useWalletFiatHint: useWalletFiatHintMock,
}));

function makeEngine(overrides: Partial<WalletPageControllerView> = {}): WalletPageControllerView {
  return {
    t: (key) => String(key),
    loading: false,
    errorKey: null,
    wallet: null,
    phonAvailableDisplay: '12345.000000',
    phonLockedDisplay: '0',
    phonRealAvailableDisplay: '10000.000000',
    phonBonusAvailableDisplay: '2345.000000',
    usdtAvailableDisplay: '500.000000',
    usdtLockedDisplay: '0',
    recentActivity: [],
    activityLoading: false,
    complianceLoading: false,
    withdrawalReady: true,
    kycStatusKey: 'wallet.kyc.verified',
    depositBlocked: false,
    withdrawalBlocked: false,
    refresh: vi.fn(),
    ...overrides,
  };
}

function renderPage(engine: WalletPageControllerView) {
  useWalletPageControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <WalletPage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  useWalletPageControllerMock.mockReset();
  useWalletFiatHintMock.mockReset();
  useWalletFiatHintMock.mockReturnValue({
    targetFiat: 'OFF',
    hintFor: () => ({
      displayOnly: true,
      disabled: true,
      formattedHint: '',
      targetFiat: 'OFF',
      asOf: '',
      stale: false,
      sourceCurrency: 'PHON',
    }),
    showDisclaimer: false,
  });
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('WalletPage', () => {
  it('renders wallet-hero Card with RPC phon balance and collapsed breakdown', () => {
    renderPage(makeEngine());

    expect(screen.getByTestId('wallet-page')).toBeInTheDocument();
    const hero = screen.getByTestId('wallet-balance-hero');
    expect(hero).toBeInTheDocument();
    expect(hero).toHaveAttribute('data-card-variant', 'wallet-hero');
    expect(hero).toHaveAttribute('data-signature', 'living-balance');
    expect(within(hero).getByText('12,345')).toBeInTheDocument();
    expect(within(hero).getByText('PHON')).toBeInTheDocument();
    expect(hero.querySelector('[data-count-up="true"]')).not.toBeNull();
    expect(screen.getByTestId('wallet-hero-details')).toBeInTheDocument();
    expect(screen.queryByTestId('wallet-hero-details-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('wallet-hero-breakdown')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('wallet-hero-details-toggle'));
    expect(screen.getByTestId('wallet-hero-details-panel')).toBeInTheDocument();
    expect(screen.getByTestId('wallet-hero-breakdown')).toBeInTheDocument();
  });

  it('links deposit, withdraw, and ledger CTAs to canonical routes', () => {
    renderPage(makeEngine());

    expect(screen.getByRole('link', { name: '입금하기' })).toHaveAttribute(
      'href',
      '/wallet/deposit',
    );
    expect(screen.getByRole('link', { name: '출금하기' })).toHaveAttribute(
      'href',
      '/wallet/withdraw',
    );
    expect(screen.getAllByRole('link', { name: '전체 보기' })[0]).toHaveAttribute(
      'href',
      '/ledger',
    );
  });

  it('shows compliance ready state when withdrawal is ready', () => {
    renderPage(makeEngine({ withdrawalReady: true, kycStatusKey: 'wallet.kyc.verified' }));

    expect(screen.getByTestId('wallet-compliance-ready')).toBeInTheDocument();
  });

  it('shows error state with retry', () => {
    const refresh = vi.fn();
    renderPage(makeEngine({ errorKey: 'wallet.loadError', refresh }));

    expect(screen.getByTestId('wallet-error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
  });

  it('renders recent ledger activity rows from controller', () => {
    renderPage(
      makeEngine({
        recentActivity: [
          {
            id: 'entry-1',
            createdAt: '2026-07-04T12:00:00.000Z',
            reasonCode: 'daily_claim',
            amount: '100.000000',
            currency: 'PHON',
            direction: 'credit',
            availableAfter: '100.000000',
            seq: 42,
            relatedEntityId: null,
            rateSnapshotId: null,
          },
        ],
      }),
    );

    expect(screen.getByTestId('wallet-activity-row')).toBeInTheDocument();
  });

  it('shows loading shell while controller is loading', () => {
    renderPage(makeEngine({ loading: true }));

    expect(screen.getByTestId('wallet-loading')).toBeInTheDocument();
  });
});
