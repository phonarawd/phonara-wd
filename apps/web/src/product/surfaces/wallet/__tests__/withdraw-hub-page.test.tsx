import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { WithdrawHubControllerView } from '@/features/wallet/use-withdraw-hub-controller';
import { I18nProvider } from '@/product/i18n';
import { WithdrawHubPage } from '@/product/surfaces/wallet/withdraw-hub-page';

const useWithdrawHubControllerMock = vi.hoisted(() => vi.fn());
const navigateMock = vi.hoisted(() => vi.fn());
const useSearchMock = vi.hoisted(() => vi.fn(() => ({ tab: undefined as 'history' | undefined })));

vi.mock('@/features/wallet/use-withdraw-hub-controller', () => ({
  useWithdrawHubController: useWithdrawHubControllerMock,
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useSearch: () => useSearchMock(),
  };
});

function makeEngine(overrides: Partial<WithdrawHubControllerView> = {}): WithdrawHubControllerView {
  return {
    loading: false,
    withdrawalBlocked: false,
    withdrawalReady: true,
    railsDisabled: false,
    rails: [
      {
        id: 'krw',
        href: '/wallet/withdraw/krw',
        titleKey: 'wallet.withdraw.rail.krw',
        descriptionKey: 'wallet.withdraw.rail.krw.desc',
        metaKey: 'wallet.withdraw.rail.krw.meta',
      },
      {
        id: 'crypto',
        href: '/wallet/withdraw/crypto',
        titleKey: 'wallet.withdraw.rail.crypto',
        descriptionKey: 'wallet.withdraw.rail.crypto.desc',
        metaKey: 'wallet.withdraw.rail.crypto.meta',
      },
    ],
    historyRows: [],
    historyLoading: false,
    ...overrides,
  };
}

function renderPage(engine: WithdrawHubControllerView) {
  useWithdrawHubControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <WithdrawHubPage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  useWithdrawHubControllerMock.mockReset();
  navigateMock.mockReset();
  useSearchMock.mockReturnValue({ tab: undefined });
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('WithdrawHubPage', () => {
  it('renders two payment method cards linking to canonical rail routes', () => {
    renderPage(makeEngine());

    expect(screen.getByTestId('withdraw-hub-page')).toBeInTheDocument();
    expect(screen.getByTestId('withdraw-rail-krw')).toHaveAttribute('href', '/wallet/withdraw/krw');
    expect(screen.getByTestId('withdraw-rail-crypto')).toHaveAttribute(
      'href',
      '/wallet/withdraw/crypto',
    );
  });

  it('shows paused banner and disables rail navigation when withdrawal is blocked', () => {
    renderPage(makeEngine({ withdrawalBlocked: true, railsDisabled: true }));

    expect(screen.getByTestId('withdraw-hub-paused')).toBeInTheDocument();
    expect(screen.getByTestId('withdraw-rail-krw')).not.toHaveAttribute('href');
  });

  it('shows KYC lock when withdrawal is not ready', () => {
    renderPage(makeEngine({ withdrawalReady: false, railsDisabled: true }));

    expect(screen.getByTestId('withdraw-hub-kyc-lock')).toBeInTheDocument();
    expect(screen.getByTestId('withdraw-rail-krw')).not.toHaveAttribute('href');
  });

  it('renders withdraw history rows on the history tab', () => {
    useSearchMock.mockReturnValue({ tab: 'history' });

    renderPage(
      makeEngine({
        historyRows: [
          {
            id: 'krw:1',
            rail: 'krw',
            createdAt: '2026-07-04T12:00:00.000Z',
            amountDisplay: '100',
            currency: 'PHON',
            status: 'pending',
            statusLabelKey: 'wallet.crypto.withdraw.status.pending',
            methodLabelKey: 'wallet.tx.method.krw',
          },
        ],
      }),
    );

    expect(screen.getByTestId('withdraw-history-row')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '전체 보기' })).toHaveAttribute('href', '/ledger');
  });

  it('shows loading shell while controller is loading', () => {
    renderPage(makeEngine({ loading: true }));

    expect(screen.getByTestId('withdraw-hub-loading')).toBeInTheDocument();
  });
});
