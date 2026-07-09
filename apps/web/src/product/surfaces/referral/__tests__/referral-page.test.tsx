import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ReferralPageControllerView } from '@/features/earn/use-referral-page-controller';
import { I18nProvider } from '@/product/i18n';
import { ReferralPage } from '@/product/surfaces/referral/referral-page';

const useReferralPageControllerMock = vi.hoisted(() => vi.fn());
const useEarnFiatHintMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/earn/use-referral-page-controller', () => ({
  useReferralPageController: useReferralPageControllerMock,
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
  overrides: Partial<ReferralPageControllerView> = {},
): ReferralPageControllerView {
  return {
    t: (key: string) => key,
    loading: false,
    error: null,
    referralCode: 'phon_user',
    inviteUrl: 'https://phonara.net/r/phon_user',
    hubReferral: {
      totalInvited: 3,
      qualifiedTotal: 2,
      pendingReview: 1,
      payoutTodayUsed: 1,
      payoutTodayMax: 3,
      payoutTodayRemaining: 2,
      perFriendBonusMultiplier: '1.25',
    },
    totalPaidRewardsLabel: '+1,000P',
    treeRows: [
      {
        id: 'ref-1',
        referredId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        state: 'paid',
        referrerPhon: '1000.000000',
        createdAt: '2026-07-01T00:00:00.000Z',
        rewardedAt: '2026-07-02T00:00:00.000Z',
      },
    ],
    missions: [
      {
        id: 'viral-shareLink',
        titleKey: 'mission.viral.shareLink',
        rewardLabel: '+25P',
        progressLabel: '1 / 3',
        state: 'reward_pending',
        claimBlocked: false,
        viralRpc: 'share_referral_link',
      },
    ],
    claimingMission: null,
    copyCode: vi.fn(),
    copyInviteLink: vi.fn(),
    claimMission: vi.fn(),
    maskReferredLabel: () => '···eeee',
    ...overrides,
  };
}

function renderPage(engine: ReferralPageControllerView) {
  useReferralPageControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <ReferralPage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  useReferralPageControllerMock.mockReset();
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

describe('ReferralPage', () => {
  it('renders referral hub header and code card', () => {
    renderPage(makeEngine());

    expect(screen.getByTestId('referral-page')).toBeInTheDocument();
    expect(screen.getByText('referral.title')).toBeInTheDocument();
    expect(screen.getByTestId('referral-code-value')).toHaveTextContent('phon_user');
    expect(screen.getByTestId('referral-invite-cta')).toHaveAttribute('href', '/referral/invite');
  });

  it('renders referral tree rows and mission cards', () => {
    renderPage(makeEngine());

    expect(screen.getByTestId('referral-tree-list')).toBeInTheDocument();
    expect(screen.getByTestId('referral-mission-viral-shareLink')).toBeInTheDocument();
    expect(screen.getByText('···eeee')).toBeInTheDocument();
  });

  it('shows loading skeleton while dashboard loads', () => {
    renderPage(makeEngine({ loading: true }));

    expect(screen.getByTestId('referral-page-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('referral-page')).not.toBeInTheDocument();
  });

  it('wires copy and claim actions', () => {
    const engine = makeEngine();
    renderPage(engine);

    fireEvent.click(screen.getByTestId('referral-copy-code'));
    expect(engine.copyCode).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'common.cta.claim' }));
    expect(engine.claimMission).toHaveBeenCalledWith('share_referral_link');
  });
});
