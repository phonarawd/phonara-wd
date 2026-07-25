import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { StakingPageControllerView } from '@/features/earn/use-staking-page-controller';
import { I18nProvider } from '@/product/i18n';
import { StakingHubPage } from '@/product/surfaces/staking/staking-hub-page';

const useStakingPageControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/earn/use-staking-page-controller', () => ({
  useStakingPageController: useStakingPageControllerMock,
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

function makeEngine(overrides: Partial<StakingPageControllerView> = {}): StakingPageControllerView {
  return {
    t: (key) => String(key),
    authLoading: false,
    loading: false,
    poolsError: false,
    positionsError: false,
    tierError: false,
    walletError: false,
    stakingBlocked: false,
    usdtAvailableDisplay: '8000.000000',
    phonAvailableDisplay: '5000.000000',
    availableDisplay: '8000.000000',
    currentTier: 'silver',
    tierApyBonusKey: 'staking.tierApyBonus.silver',
    referenceAssets: ['PHON', 'BTC', 'ETH'],
    selectedReferenceAsset: 'BTC',
    stakeCurrency: 'USDT',
    poolCards: [
      {
        id: 'pool-flex',
        referenceAsset: 'BTC',
        stakeCurrency: 'USDT',
        displayName: 'BTC · USDT Flexible',
        term: 'flexible',
        termLabelKey: 'staking.term.flexible',
        lockDays: 0,
        baseAprDisplay: '3.0%',
        tierApyBonusKey: 'staking.tierApyBonus.silver',
      },
      {
        id: 'pool-30',
        referenceAsset: 'BTC',
        stakeCurrency: 'USDT',
        displayName: 'BTC · USDT 30D',
        term: 'days_30',
        termLabelKey: 'staking.term.days_30',
        lockDays: 30,
        baseAprDisplay: '12.0%',
        tierApyBonusKey: 'staking.tierApyBonus.silver',
      },
    ],
    selectedPool: null,
    selectedPoolId: 'pool-30',
    stakeAmount: '',
    canStake: false,
    stakeBusy: false,
    actionBusy: false,
    activePositions: [],
    confirmOpen: false,
    wizardStep: 'pool',
    submitDisabledReason: null,
    claimBlockedReason: null,
    positionActionsDisabled: false,
    isPositionClaimDisabled: () => false,
    insufficientAvail: false,
    selectReferenceAsset: vi.fn(),
    setStakeCurrency: vi.fn(),
    selectPool: vi.fn(),
    setStakeAmount: vi.fn(),
    openStakeConfirm: vi.fn(),
    closeStakeConfirm: vi.fn(),
    goToWizardStep: vi.fn(),
    wizardNext: vi.fn(),
    wizardBack: vi.fn(),
    confirmStake: vi.fn(),
    unstakePosition: vi.fn(),
    claimReward: vi.fn(),
    refresh: vi.fn(),
    ...overrides,
  };
}

function renderPage(engine = makeEngine()) {
  useStakingPageControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <StakingHubPage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  useStakingPageControllerMock.mockReset();
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('StakingHubPage', () => {
  it('renders staking hub with majors pool catalog and stake form', () => {
    renderPage();

    expect(screen.getByTestId('staking-hub-page')).toBeInTheDocument();
    expect(screen.getByTestId('staking-balance-card')).toBeInTheDocument();
    expect(screen.getByTestId('staking-stake-wizard')).toBeInTheDocument();
    expect(screen.getByTestId('staking-wizard-steps')).toBeInTheDocument();
    expect(screen.getByTestId('staking-wizard-panel-pool')).toBeInTheDocument();
    expect(screen.getByTestId('staking-reference-BTC')).toBeInTheDocument();
    expect(screen.getByTestId('staking-stake-currency-selector')).toBeInTheDocument();
    expect(screen.getByTestId('staking-pool-pool-flex')).toBeInTheDocument();
    expect(screen.getByTestId('staking-pool-pool-30')).toBeInTheDocument();
    expect(screen.getByTestId('staking-tier-badge')).toHaveTextContent('earn.tier.silver');
  });

  it('shows loading shell while data loads', () => {
    renderPage(makeEngine({ loading: true }));

    expect(screen.getByTestId('staking-hub-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('staking-hub-page')).not.toBeInTheDocument();
  });

  it('shows paused gate when staking is blocked', () => {
    renderPage(makeEngine({ stakingBlocked: true }));

    expect(screen.getByTestId('staking-gate-paused')).toBeInTheDocument();
    expect(screen.queryByTestId('staking-stake-wizard')).not.toBeInTheDocument();
  });

  it('wires wizard pool step selection controls (P2-3)', () => {
    const selectReferenceAsset = vi.fn();
    const setStakeCurrency = vi.fn();
    const selectPool = vi.fn();
    renderPage(
      makeEngine({
        selectReferenceAsset,
        setStakeCurrency,
        selectPool,
        wizardStep: 'pool',
      }),
    );

    fireEvent.click(screen.getByTestId('staking-reference-ETH'));
    expect(selectReferenceAsset).toHaveBeenCalledWith('ETH');

    fireEvent.click(screen.getByTestId('staking-stake-currency-phon'));
    expect(setStakeCurrency).toHaveBeenCalledWith('PHON');

    fireEvent.click(screen.getByTestId('staking-pool-pool-flex'));
    expect(selectPool).toHaveBeenCalledWith('pool-flex');
  });

  it('opens stake confirm from wizard confirm step (P2-3)', () => {
    const openStakeConfirm = vi.fn();
    renderPage(
      makeEngine({
        openStakeConfirm,
        selectedPoolId: 'pool-30',
        stakeAmount: '100',
        canStake: true,
        wizardStep: 'confirm',
      }),
    );

    fireEvent.click(screen.getByTestId('staking-stake-cta'));
    expect(openStakeConfirm).toHaveBeenCalledTimes(1);
  });

  it('keeps wizard next enabled on amount step when balance is insufficient (P0-1)', () => {
    const wizardNext = vi.fn();
    renderPage(
      makeEngine({
        wizardNext,
        selectedPoolId: 'pool-30',
        stakeAmount: '999999',
        canStake: false,
        insufficientAvail: true,
        wizardStep: 'amount',
      }),
    );

    const next = screen.getByTestId('staking-wizard-next');
    expect(next).not.toBeDisabled();
    fireEvent.click(next);
    expect(wizardNext).toHaveBeenCalledTimes(1);
  });

  it('renders active positions with claim and unstake actions', () => {
    const claimReward = vi.fn();
    const unstakePosition = vi.fn();
    renderPage(
      makeEngine({
        activePositions: [
          {
            id: 'pos-1',
            referenceAsset: 'BTC',
            stakeCurrency: 'USDT',
            poolLabel: 'BTC · USDT',
            termLabelKey: 'staking.term.days_30',
            principalDisplay: '1000.000000',
            rewardClaimedDisplay: '0.000000',
            pendingRewardDisplay: '2.500000',
            aprSnapshotDisplay: '12.0%',
            statusKey: 'staking.position.status.active',
            locked: false,
            unlockAt: null,
          },
        ],
        claimReward,
        unstakePosition,
      }),
    );

    const row = screen.getByTestId('staking-position-pos-1');
    expect(within(row).getByText('BTC · USDT')).toBeInTheDocument();
    expect(screen.getByTestId('staking-hub-positions-link')).toHaveAttribute(
      'href',
      '/staking/positions',
    );

    fireEvent.click(screen.getByTestId('staking-claim-pos-1'));
    expect(claimReward).toHaveBeenCalledWith('pos-1');

    fireEvent.click(screen.getByTestId('staking-unstake-pos-1'));
    expect(unstakePosition).not.toHaveBeenCalled();
    expect(screen.getByText('confirm.unstake.title')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'confirm.proceed' }));
    expect(unstakePosition).toHaveBeenCalledWith('pos-1');
  });

  it('shows empty positions state', () => {
    renderPage(makeEngine({ activePositions: [] }));

    expect(screen.getByTestId('staking-empty-positions')).toBeInTheDocument();
    expect(screen.getByText('staking.noneActive')).toBeInTheDocument();
    expect(screen.queryByTestId('staking-hub-positions-link')).not.toBeInTheDocument();
  });

  it('shows outer empty pools only when no reference assets exist (P1-D)', () => {
    renderPage(
      makeEngine({
        referenceAssets: [],
        poolCards: [],
      }),
    );

    expect(screen.getByTestId('staking-empty-pools')).toBeInTheDocument();
    expect(screen.queryByTestId('staking-stake-wizard')).not.toBeInTheDocument();
    expect(screen.queryByTestId('staking-pools-filter-empty')).not.toBeInTheDocument();
    expect(screen.getAllByText('staking.emptyPools')).toHaveLength(1);
  });

  it('shows wizard filter-empty only when pools exist but filter yields none (P1-D)', () => {
    renderPage(
      makeEngine({
        referenceAssets: ['BTC', 'ETH'],
        selectedReferenceAsset: 'BTC',
        poolCards: [],
        wizardStep: 'pool',
      }),
    );

    expect(screen.queryByTestId('staking-empty-pools')).not.toBeInTheDocument();
    expect(screen.getByTestId('staking-stake-wizard')).toBeInTheDocument();
    expect(screen.getByTestId('staking-pools-filter-empty')).toBeInTheDocument();
    expect(screen.getAllByText('staking.emptyPools')).toHaveLength(1);
  });

  it('shows wallet error banner with retry and unavailable balances (P0-2)', () => {
    const refresh = vi.fn();
    renderPage(
      makeEngine({
        walletError: true,
        usdtAvailableDisplay: null,
        phonAvailableDisplay: null,
        availableDisplay: null,
        refresh,
      }),
    );

    expect(screen.getByTestId('staking-wallet-error')).toBeInTheDocument();
    expect(screen.getByText('wallet.loadError')).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();

    const balances = screen.getByTestId('staking-wallet-balances');
    expect(within(balances).getAllByText('—')).toHaveLength(2);

    fireEvent.click(within(screen.getByTestId('staking-wallet-error')).getByText('common.retry'));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('shows tier error banner, hides tier badge, and disables claim/unstake (P0-4)', () => {
    const refresh = vi.fn();
    const claimReward = vi.fn();
    const unstakePosition = vi.fn();
    renderPage(
      makeEngine({
        tierError: true,
        claimBlockedReason: 'staking.tier.loadErrorRetry',
        positionActionsDisabled: true,
        isPositionClaimDisabled: () => true,
        refresh,
        claimReward,
        unstakePosition,
        activePositions: [
          {
            id: 'pos-1',
            referenceAsset: 'PHON',
            stakeCurrency: 'PHON',
            poolLabel: 'PHON · PHON',
            termLabelKey: 'staking.term.flexible',
            principalDisplay: '100.000000',
            rewardClaimedDisplay: '0.000000',
            pendingRewardDisplay: null,
            aprSnapshotDisplay: '3.0%',
            statusKey: 'staking.position.status.active',
            locked: false,
            unlockAt: null,
          },
        ],
      }),
    );

    expect(screen.getByTestId('staking-tier-error')).toBeInTheDocument();
    expect(
      within(screen.getByTestId('staking-tier-error')).getByText('staking.tier.loadErrorRetry'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('staking-tier-badge')).not.toBeInTheDocument();
    expect(screen.getByTestId('staking-claim-blocked-reason')).toHaveTextContent(
      'staking.tier.loadErrorRetry',
    );

    const claimButton = screen.getByTestId('staking-claim-pos-1');
    const unstakeButton = screen.getByTestId('staking-unstake-pos-1');
    expect(claimButton).toBeDisabled();
    expect(unstakeButton).toBeDisabled();

    fireEvent.click(claimButton);
    fireEvent.click(unstakeButton);
    expect(claimReward).not.toHaveBeenCalled();
    expect(unstakePosition).not.toHaveBeenCalled();

    fireEvent.click(within(screen.getByTestId('staking-tier-error')).getByText('common.retry'));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('disables claim when pending reward is zero (P1-C)', () => {
    const claimReward = vi.fn();
    const isPositionClaimDisabled = vi.fn(() => true);
    renderPage(
      makeEngine({
        claimReward,
        isPositionClaimDisabled,
        activePositions: [
          {
            id: 'pos-1',
            referenceAsset: 'PHON',
            stakeCurrency: 'PHON',
            poolLabel: 'PHON · PHON',
            termLabelKey: 'staking.term.flexible',
            principalDisplay: '100.000000',
            rewardClaimedDisplay: '0.000000',
            pendingRewardDisplay: '0.000000',
            aprSnapshotDisplay: '3.0%',
            statusKey: 'staking.position.status.active',
            locked: false,
            unlockAt: null,
          },
        ],
      }),
    );

    const claimButton = screen.getByTestId('staking-claim-pos-1');
    expect(claimButton).toBeDisabled();
    expect(screen.getByTestId('staking-claim-blocked-reason-pos-1')).toHaveTextContent(
      'staking.claimNothingYet',
    );

    fireEvent.click(claimButton);
    expect(claimReward).not.toHaveBeenCalled();
  });
});
