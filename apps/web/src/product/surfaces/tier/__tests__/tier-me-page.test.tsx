import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TierMePageControllerView } from '@/features/earn/use-tier-me-page-controller';
import { I18nProvider } from '@/product/i18n';
import { TierMePage } from '@/product/surfaces/tier/tier-me-page';

const useTierMePageControllerMock = vi.hoisted(() => vi.fn());
const useEarnFiatHintMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/earn/use-tier-me-page-controller', () => ({
  useTierMePageController: useTierMePageControllerMock,
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

function makeEngine(overrides: Partial<TierMePageControllerView> = {}): TierMePageControllerView {
  return {
    t: (key: string) => key,
    loading: false,
    error: null,
    tierProgress: {
      tier: 'silver',
      xp: 12000,
      nextTier: 'gold',
      nextTierXp: 25000,
      progressPercent: 35,
      atMaxTier: false,
    },
    limitsToday: [
      {
        action: 'attendance',
        labelKey: 'earn.limits.action.attendance',
        used: 1,
        max: 2,
        remaining: 1,
      },
    ],
    decayPanel: {
      eligible: true,
      maintenanceWindowDays: 45,
      maintenanceConditionKey: 'tier.guide.decay.silver.condition',
      lowerTier: 'bronze',
      lowerTierLabelKey: 'earn.tier.bronze',
      impactRows: [],
      engineLive: true,
      daysLeft: 18,
      meetsMaintenance: false,
    },
    keepMission: {
      state: 'reward_pending',
      rewardLabel: '+4,000P',
      progressLabel: '1 / 1',
      canClaim: true,
      claimBlocked: false,
      unavailableReasonKey: null,
    },
    qualifiedReferrals: 1,
    totalInvited: 3,
    claimingKeepMission: false,
    claimKeepMission: vi.fn(),
    ...overrides,
  };
}

function renderPage(engine: TierMePageControllerView = makeEngine()) {
  useTierMePageControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <TierMePage />
    </I18nProvider>,
  );
}

describe('TierMePage', () => {
  beforeEach(() => {
    useTierMePageControllerMock.mockReset();
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

  it('renders loading skeleton', () => {
    renderPage(makeEngine({ loading: true, tierProgress: null }));
    expect(screen.getByTestId('tier-me-loading')).toBeInTheDocument();
  });

  it('renders tier hero, decay panel, limits, and keep mission', () => {
    renderPage();
    expect(screen.getByTestId('tier-me-page')).toBeInTheDocument();
    expect(screen.getByTestId('tier-me-badge')).toBeInTheDocument();
    expect(screen.getByTestId('tier-me-progress-card')).toHaveAttribute('data-card-variant', 'vip');
    expect(screen.getByTestId('tier-me-progress-card')).toHaveAttribute('data-signature', 'xp-fill');
    expect(screen.getByTestId('tier-me-xp')).toHaveAttribute('data-count-up', 'true');
    expect(screen.getByTestId('tier-me-decay-panel')).toBeInTheDocument();
    expect(screen.getByTestId('tier-me-decay-countdown')).toBeInTheDocument();
    expect(screen.getByTestId('tier-me-decay-maintenance')).toBeInTheDocument();
    expect(screen.getByTestId('tier-me-limits')).toBeInTheDocument();
    expect(screen.getByTestId('tier-me-keep-mission')).toBeInTheDocument();
    expect(screen.getByTestId('tier-me-history-link')).toHaveAttribute('href', '/tier/me/history');
  });

  it('shows tier keep mission claim CTA when E1 engine is live', () => {
    renderPage();
    expect(screen.getByTestId('tier-me-keep-mission')).toBeInTheDocument();
    expect(screen.queryByText('earn.mission.unavailable.tierKeepStatus')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'common.cta.claim' })).toBeInTheDocument();
  });

  it('hides decay panel for bronze floor tier', () => {
    renderPage(
      makeEngine({
        tierProgress: {
          tier: 'bronze',
          xp: 1000,
          nextTier: 'silver',
          nextTierXp: 5000,
          progressPercent: 20,
          atMaxTier: false,
        },
        decayPanel: {
          eligible: false,
          maintenanceWindowDays: 45,
          maintenanceConditionKey: 'tier.guide.decay.bronze.condition',
          lowerTier: null,
          lowerTierLabelKey: null,
          impactRows: [],
          engineLive: true,
          daysLeft: 45,
          meetsMaintenance: true,
        },
        keepMission: null,
      }),
    );
    expect(screen.queryByTestId('tier-me-decay-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tier-me-keep-mission')).not.toBeInTheDocument();
  });
});
