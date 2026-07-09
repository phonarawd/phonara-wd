import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { HomeMissionsPageControllerView } from '@/features/earn/use-home-missions-page-controller';
import { I18nProvider } from '@/product/i18n';
import { HomeMissionsPage } from '@/product/surfaces/home/home-missions-page';

const useHomeMissionsPageControllerMock = vi.hoisted(() => vi.fn());
const useEarnFiatHintMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/earn/use-home-missions-page-controller', () => ({
  useHomeMissionsPageController: useHomeMissionsPageControllerMock,
}));

vi.mock('@/features/earn/use-earn-fiat-hint', () => ({
  useEarnFiatHint: useEarnFiatHintMock,
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
  overrides: Partial<HomeMissionsPageControllerView> = {},
): HomeMissionsPageControllerView {
  return {
    t: (key: string) => key,
    loading: false,
    error: null,
    activeTab: 'viral',
    missionId: undefined,
    missions: [
      {
        id: 'viral-shareLink',
        titleKey: 'mission.viral.shareLink',
        rewardLabel: '+25P',
        progressLabel: '0 / 3',
        state: 'reward_pending',
        claimBlocked: false,
        canClaim: true,
        ctaRoute: null,
        viralRpc: 'share_referral_link',
        repeatableRpc: null,
        highlighted: false,
      },
    ],
    completedCount: 0,
    totalVisibleCount: 1,
    claimingMission: null,
    setActiveTab: vi.fn(),
    openMission: vi.fn(),
    closeMission: vi.fn(),
    claimMission: vi.fn(),
    ...overrides,
  };
}

function renderPage(
  engine: HomeMissionsPageControllerView,
  search: Record<string, unknown> = { tab: 'viral' },
) {
  useHomeMissionsPageControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <HomeMissionsPage search={search} />
    </I18nProvider>,
  );
}

beforeEach(() => {
  useHomeMissionsPageControllerMock.mockReset();
  useEarnFiatHintMock.mockReset();
  useEarnFiatHintMock.mockReturnValue({
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
});

describe('HomeMissionsPage', () => {
  it('renders hub header and default viral tab', () => {
    renderPage(makeEngine());

    expect(screen.getByTestId('home-missions-page')).toBeInTheDocument();
    expect(screen.getByText('earn.missions.hubTitle')).toBeInTheDocument();
    expect(screen.getByTestId('home-missions-tab-viral')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('home-mission-viral-shareLink')).toBeInTheDocument();
  });

  it('renders loading skeleton', () => {
    renderPage(makeEngine({ loading: true }));

    expect(screen.getByTestId('home-missions-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('home-missions-page')).not.toBeInTheDocument();
  });

  it('switches tabs and claims mission rewards', () => {
    const setActiveTab = vi.fn();
    const claimMission = vi.fn();
    renderPage(makeEngine({ setActiveTab, claimMission }));

    fireEvent.click(screen.getByTestId('home-missions-tab-weekly'));
    expect(setActiveTab).toHaveBeenCalledWith('weekly');

    fireEvent.click(screen.getByRole('button', { name: 'common.cta.claim' }));
    expect(claimMission).toHaveBeenCalledWith('viral-shareLink');
  });

  it('shows mission detail panel when missionId is selected', () => {
    renderPage(
      makeEngine({
        missionId: 'viral-shareLink',
        missions: [
          {
            id: 'viral-shareLink',
            titleKey: 'mission.viral.shareLink',
            rewardLabel: '+25P',
            progressLabel: '0 / 3',
            state: 'reward_pending',
            claimBlocked: false,
            canClaim: true,
            ctaRoute: null,
            viralRpc: 'share_referral_link',
            repeatableRpc: null,
            highlighted: true,
          },
        ],
      }),
      { tab: 'viral', missionId: 'viral-shareLink' },
    );

    expect(screen.getByTestId('home-missions-detail')).toBeInTheDocument();
    expect(screen.getByTestId('home-missions-detail-claim')).toBeInTheDocument();
  });
});
