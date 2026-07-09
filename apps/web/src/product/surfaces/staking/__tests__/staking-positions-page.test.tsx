import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { StakingPositionsPageControllerView } from '@/features/earn/use-staking-positions-page-controller';
import { I18nProvider } from '@/product/i18n';
import { StakingPositionsPage } from '@/product/surfaces/staking/staking-positions-page';

const useStakingPositionsPageControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/earn/use-staking-positions-page-controller', () => ({
  useStakingPositionsPageController: useStakingPositionsPageControllerMock,
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

function makeEngine(
  overrides: Partial<StakingPositionsPageControllerView> = {},
): StakingPositionsPageControllerView {
  return {
    t: (key) => String(key),
    authLoading: false,
    positionsLoading: false,
    positionsError: false,
    activeTab: 'active',
    activePositions: [
      {
        id: 'pos-1',
        referenceAsset: 'BTC',
        stakeCurrency: 'USDT',
        poolLabel: 'BTC · USDT',
        termLabelKey: 'staking.term.days_30',
        principalDisplay: '1000.000000',
        rewardClaimedDisplay: '0.000000',
        pendingRewardDisplay: null,
        aprSnapshotDisplay: '12.0%',
        statusKey: 'staking.position.status.active',
        locked: false,
        unlockAt: null,
      },
    ],
    unstakedPositions: [],
    activeCount: 1,
    unstakedCount: 0,
    actionBusy: false,
    setActiveTab: vi.fn(),
    unstakePosition: vi.fn(),
    claimReward: vi.fn(),
    refresh: vi.fn(),
    ...overrides,
  };
}

function renderPage(engine = makeEngine()) {
  useStakingPositionsPageControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <StakingPositionsPage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  useStakingPositionsPageControllerMock.mockReset();
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('StakingPositionsPage', () => {
  it('renders positions page with active positions and actions', () => {
    renderPage();

    expect(screen.getByTestId('staking-positions-page')).toBeInTheDocument();
    expect(screen.getByTestId('staking-positions-tab-active')).toBeInTheDocument();
    expect(screen.getByTestId('staking-positions-panel')).toBeInTheDocument();
    expect(screen.getByTestId('staking-position-pos-1')).toBeInTheDocument();
    expect(screen.getByTestId('staking-claim-pos-1')).toBeInTheDocument();
    expect(screen.getByTestId('staking-unstake-pos-1')).toBeInTheDocument();
    expect(screen.getByTestId('staking-positions-hub-link')).toHaveAttribute('href', '/staking');
  });

  it('shows loading shell while positions load', () => {
    renderPage(makeEngine({ positionsLoading: true }));

    expect(screen.getByTestId('staking-positions-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('staking-positions-page')).not.toBeInTheDocument();
  });

  it('shows retry panel when positions fail to load', () => {
    const refresh = vi.fn();
    renderPage(makeEngine({ positionsError: true, refresh }));

    expect(screen.getByTestId('staking-positions-error')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'common.retry' }));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('wires claim and unstake actions for active positions', () => {
    const claimReward = vi.fn();
    const unstakePosition = vi.fn();
    renderPage(makeEngine({ claimReward, unstakePosition }));

    fireEvent.click(screen.getByTestId('staking-claim-pos-1'));
    expect(claimReward).toHaveBeenCalledWith('pos-1');

    fireEvent.click(screen.getByTestId('staking-unstake-pos-1'));
    expect(unstakePosition).toHaveBeenCalledWith('pos-1');
  });

  it('renders unstaked history when active tab is unstaked', () => {
    renderPage(
      makeEngine({
        activeTab: 'unstaked',
        activePositions: [],
        unstakedPositions: [
          {
            id: 'pos-2',
            referenceAsset: 'ETH',
            stakeCurrency: 'PHON',
            poolLabel: 'ETH · PHON',
            termLabelKey: 'staking.term.flexible',
            principalDisplay: '500.000000',
            rewardClaimedDisplay: '10.000000',
            pendingRewardDisplay: null,
            aprSnapshotDisplay: '3.0%',
            statusKey: 'staking.position.status.active',
            locked: false,
            unlockAt: null,
          },
        ],
        activeCount: 0,
        unstakedCount: 1,
      }),
    );

    const row = screen.getByTestId('staking-position-pos-2');
    expect(within(row).getByText('staking.term.flexible')).toBeInTheDocument();
    expect(screen.queryByTestId('staking-claim-pos-2')).not.toBeInTheDocument();
  });

  it('shows empty state when no active positions', () => {
    renderPage(makeEngine({ activePositions: [], activeCount: 0 }));

    expect(screen.getByTestId('staking-positions-empty')).toBeInTheDocument();
    expect(screen.getByText('staking.noneActive')).toBeInTheDocument();
  });
});
