import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { LedgerPageControllerView } from '@/features/wallet/use-ledger-page-controller';
import { I18nProvider } from '@/product/i18n';
import { LedgerPage } from '@/product/surfaces/wallet/ledger-page';

const useLedgerPageControllerMock = vi.hoisted(() => vi.fn());
const useWalletFiatHintMock = vi.hoisted(() => vi.fn());
const navigateMock = vi.hoisted(() => vi.fn());
const useSearchMock = vi.hoisted(() => vi.fn(() => ({})));

vi.mock('@/features/wallet/use-ledger-page-controller', () => ({
  useLedgerPageController: useLedgerPageControllerMock,
}));

vi.mock('@/features/wallet/use-wallet-fiat-hint', () => ({
  useWalletFiatHint: useWalletFiatHintMock,
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useSearch: () => useSearchMock(),
  };
});

function makeEngine(overrides: Partial<LedgerPageControllerView> = {}): LedgerPageControllerView {
  return {
    loading: false,
    errorKey: null,
    rows: [],
    filteredCount: 0,
    page: 1,
    totalPages: 1,
    empty: false,
    filterEmpty: false,
    refresh: vi.fn(),
    ...overrides,
  };
}

function renderPage(engine: LedgerPageControllerView) {
  useLedgerPageControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <LedgerPage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  useLedgerPageControllerMock.mockReset();
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
  navigateMock.mockReset();
  useSearchMock.mockReturnValue({});
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('LedgerPage', () => {
  it('renders page header and back link to wallet', () => {
    renderPage(makeEngine());

    expect(screen.getByTestId('ledger-page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '원장' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '지갑으로' })).toHaveAttribute('href', '/wallet');
    expect(screen.getByTestId('ledger-rewards-history-link')).toHaveAttribute(
      'href',
      '/rewards/history',
    );
  });

  it('renders ledger rows with tabular money display', () => {
    renderPage(
      makeEngine({
        rows: [
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
        filteredCount: 1,
      }),
    );

    const rows = screen.getAllByTestId('ledger-row');
    expect(rows).toHaveLength(2);
    expect(within(rows[0]!).getByText('일일 체크인 보상')).toBeInTheDocument();
    expect(within(rows[0]!).getByText('100')).toBeInTheDocument();
  });

  it('shows empty state when controller has no rows', () => {
    renderPage(makeEngine({ empty: true }));

    expect(screen.getByTestId('ledger-empty')).toBeInTheDocument();
  });

  it('shows filter empty state', () => {
    renderPage(makeEngine({ filterEmpty: true }));

    expect(screen.getByTestId('ledger-filter-empty')).toBeInTheDocument();
  });

  it('shows error state with retry', () => {
    const refresh = vi.fn();
    renderPage(makeEngine({ errorKey: 'wallet.ledger.loadError', refresh }));

    expect(screen.getByTestId('ledger-error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
  });

  it('shows loading shell while controller is loading', () => {
    renderPage(makeEngine({ loading: true }));

    expect(screen.getByTestId('ledger-loading')).toBeInTheDocument();
  });

  it('renders pagination when multiple pages exist', () => {
    renderPage(
      makeEngine({
        rows: [
          {
            id: 'entry-1',
            createdAt: '2026-07-04T12:00:00.000Z',
            reasonCode: 'daily_claim',
            amount: '10.000000',
            currency: 'PHON',
            direction: 'credit',
            availableAfter: '10.000000',
            seq: 1,
            relatedEntityId: null,
            rateSnapshotId: null,
          },
        ],
        filteredCount: 25,
        page: 1,
        totalPages: 2,
      }),
    );

    expect(screen.getByTestId('ledger-pagination')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '다음' }));
    expect(navigateMock).toHaveBeenCalled();
  });
});
