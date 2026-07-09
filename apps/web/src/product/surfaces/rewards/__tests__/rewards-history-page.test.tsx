import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { RewardsHistoryControllerView } from '@/features/earn/use-rewards-history-controller';
import { I18nProvider } from '@/product/i18n';
import { RewardsHistoryPage } from '@/product/surfaces/rewards/rewards-history-page';

const useRewardsHistoryControllerMock = vi.hoisted(() => vi.fn());
const navigateMock = vi.hoisted(() => vi.fn());
const useSearchMock = vi.hoisted(() => vi.fn(() => ({})));

vi.mock('@/features/earn/use-rewards-history-controller', () => ({
  useRewardsHistoryController: useRewardsHistoryControllerMock,
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useSearch: () => useSearchMock(),
  };
});

function makeEngine(
  overrides: Partial<RewardsHistoryControllerView> = {},
): RewardsHistoryControllerView {
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

function renderPage(engine: RewardsHistoryControllerView) {
  useRewardsHistoryControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <RewardsHistoryPage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  useRewardsHistoryControllerMock.mockReset();
  navigateMock.mockReset();
  useSearchMock.mockReturnValue({});
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('RewardsHistoryPage', () => {
  it('renders page header and back link to home', () => {
    renderPage(makeEngine());

    expect(screen.getByTestId('rewards-history-page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '보상 내역' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '홈으로' })).toHaveAttribute('href', '/home');
  });

  it('links to full ledger with reward filter', () => {
    renderPage(makeEngine());

    expect(screen.getByRole('link', { name: '전체 거래내역 보기' })).toHaveAttribute(
      'href',
      '/ledger?filter=reward',
    );
  });

  it('renders reward rows with tabular money display', () => {
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

    const rows = screen.getAllByTestId('rewards-history-row');
    expect(rows).toHaveLength(2);
    expect(within(rows[0]!).getByText('일일 체크인 보상')).toBeInTheDocument();
    expect(within(rows[0]!).getByText('+100')).toBeInTheDocument();
  });

  it('shows empty state when controller has no reward rows', () => {
    renderPage(makeEngine({ empty: true }));

    expect(screen.getByTestId('rewards-history-empty')).toBeInTheDocument();
  });

  it('shows filter empty state', () => {
    renderPage(makeEngine({ filterEmpty: true }));

    expect(screen.getByTestId('rewards-history-filter-empty')).toBeInTheDocument();
  });

  it('shows error state with retry', () => {
    const refresh = vi.fn();
    renderPage(makeEngine({ errorKey: 'wallet.ledger.loadError', refresh }));

    expect(screen.getByTestId('rewards-history-error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
  });

  it('shows loading shell while controller is loading', () => {
    renderPage(makeEngine({ loading: true }));

    expect(screen.getByTestId('rewards-history-loading')).toBeInTheDocument();
  });

  it('renders pagination when multiple pages exist', () => {
    renderPage(
      makeEngine({
        rows: [
          {
            id: 'entry-1',
            createdAt: '2026-07-04T12:00:00.000Z',
            reasonCode: 'welcome_bonus',
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

    expect(screen.getByTestId('rewards-history-pagination')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '다음' }));
    expect(navigateMock).toHaveBeenCalled();
  });
});
