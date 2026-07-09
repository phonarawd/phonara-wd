import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DepositHubControllerView } from '@/features/wallet/use-deposit-hub-controller';
import { I18nProvider } from '@/product/i18n';
import { DepositHubPage } from '@/product/surfaces/wallet/deposit-hub-page';

const useDepositHubControllerMock = vi.hoisted(() => vi.fn());
const navigateMock = vi.hoisted(() => vi.fn());
const useSearchMock = vi.hoisted(() => vi.fn(() => ({ tab: undefined as 'history' | undefined })));

vi.mock('@/features/wallet/use-deposit-hub-controller', () => ({
  useDepositHubController: useDepositHubControllerMock,
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useSearch: () => useSearchMock(),
  };
});

function makeEngine(overrides: Partial<DepositHubControllerView> = {}): DepositHubControllerView {
  return {
    loading: false,
    depositBlocked: false,
    rails: [
      {
        id: 'krw',
        href: '/wallet/deposit/krw',
        titleKey: 'wallet.deposit.rail.krw',
        descriptionKey: 'wallet.deposit.rail.krw.desc',
        metaKey: 'wallet.deposit.krw.sla',
      },
      {
        id: 'crypto',
        href: '/wallet/deposit/crypto',
        titleKey: 'wallet.deposit.rail.crypto',
        descriptionKey: 'wallet.deposit.rail.crypto.desc',
        metaKey: 'wallet.deposit.crypto.min',
      },
      {
        id: 'giftcard',
        href: '/wallet/deposit/giftcard',
        titleKey: 'wallet.deposit.rail.giftcard',
        descriptionKey: 'wallet.deposit.rail.giftcard.desc',
        metaKey: 'wallet.deposit.giftcard.eta',
      },
    ],
    historyRows: [],
    historyLoading: false,
    ...overrides,
  };
}

function renderPage(engine: DepositHubControllerView) {
  useDepositHubControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <DepositHubPage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  useDepositHubControllerMock.mockReset();
  navigateMock.mockReset();
  useSearchMock.mockReturnValue({ tab: undefined });
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('DepositHubPage', () => {
  it('renders three payment method cards linking to canonical rail routes', () => {
    renderPage(makeEngine());

    expect(screen.getByTestId('deposit-hub-page')).toBeInTheDocument();
    expect(screen.getByTestId('deposit-rail-krw')).toHaveAttribute('href', '/wallet/deposit/krw');
    expect(screen.getByTestId('deposit-rail-crypto')).toHaveAttribute(
      'href',
      '/wallet/deposit/crypto',
    );
    expect(screen.getByTestId('deposit-rail-giftcard')).toHaveAttribute(
      'href',
      '/wallet/deposit/giftcard',
    );
  });

  it('shows paused banner and disables rail navigation when deposit is blocked', () => {
    renderPage(makeEngine({ depositBlocked: true }));

    expect(screen.getByTestId('deposit-hub-paused')).toBeInTheDocument();
    expect(screen.getByTestId('deposit-rail-krw')).not.toHaveAttribute('href');
  });

  it('renders deposit history rows on the history tab', () => {
    useSearchMock.mockReturnValue({ tab: 'history' });

    renderPage(
      makeEngine({
        historyRows: [
          {
            id: 'krw:1',
            rail: 'krw',
            createdAt: '2026-07-04T12:00:00.000Z',
            amountDisplay: '50000',
            currency: 'KRW',
            status: 'pending',
            statusLabelKey: 'wallet.deposit.krw.status.pending',
            methodLabelKey: 'wallet.tx.method.krw',
          },
        ],
      }),
    );

    expect(screen.getByTestId('deposit-history-row')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '전체 보기' })).toHaveAttribute('href', '/ledger');
  });

  it('shows loading shell while controller is loading', () => {
    renderPage(makeEngine({ loading: true }));

    expect(screen.getByTestId('deposit-hub-loading')).toBeInTheDocument();
  });
});
