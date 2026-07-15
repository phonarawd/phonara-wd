import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ReferralInvitePageControllerView } from '@/features/earn/use-referral-invite-page-controller';
import { I18nProvider } from '@/product/i18n';
import { ReferralInvitePage } from '@/product/surfaces/referral/referral-invite-page';

const useReferralInvitePageControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/earn/use-referral-invite-page-controller', () => ({
  useReferralInvitePageController: useReferralInvitePageControllerMock,
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
  overrides: Partial<ReferralInvitePageControllerView> = {},
): ReferralInvitePageControllerView {
  return {
    t: (key: string) => key,
    loading: false,
    error: null,
    referralCode: 'phon_user',
    inviteUrl: 'https://phonara.net/r/phon_user',
    hubReferral: {
      totalInvited: 2,
      qualifiedTotal: 1,
      pendingReview: 0,
      payoutTodayUsed: 1,
      payoutTodayMax: 3,
      payoutTodayRemaining: 2,
      perFriendBonusMultiplier: '1.00',
    },
    shareRewardLabel: '+25P',
    shareQuotaLabel: 'quota',
    webShareAvailable: true,
    shareBusy: false,
    claimBusy: false,
    canClaimShareReward: true,
    copyCode: vi.fn(),
    copyInviteLink: vi.fn(),
    shareInvite: vi.fn(),
    claimShareReward: vi.fn(),
    kakaoShareAvailable: true,
    kakaoShareBusy: false,
    shareViaKakao: vi.fn(),
    ...overrides,
  };
}

function renderPage(engine: ReferralInvitePageControllerView) {
  useReferralInvitePageControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <ReferralInvitePage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  useReferralInvitePageControllerMock.mockReset();
});

describe('ReferralInvitePage', () => {
  it('renders share card preview and canonical web share cta', () => {
    renderPage(makeEngine());

    expect(screen.getByTestId('referral-invite-page')).toBeInTheDocument();
    expect(screen.getByTestId('referral-invite-share-card')).toBeInTheDocument();
    expect(screen.getByTestId('referral-invite-code')).toHaveTextContent('phon_user');
    expect(screen.getByTestId('referral-invite-reward')).toHaveTextContent('+25P');
    expect(screen.getByTestId('referral-invite-share')).toHaveTextContent(
      'referral.share.card.share',
    );
    expect(screen.getByTestId('referral-invite-back')).toHaveAttribute('href', '/referral');
  });

  it('shows loading skeleton while snapshot loads', () => {
    renderPage(makeEngine({ loading: true }));

    expect(screen.getByTestId('referral-invite-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('referral-invite-page')).not.toBeInTheDocument();
  });

  it('wires share, claim, and copy actions', () => {
    const engine = makeEngine();
    renderPage(engine);

    fireEvent.click(screen.getByTestId('referral-invite-share'));
    expect(engine.shareInvite).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('referral-invite-claim'));
    expect(engine.claimShareReward).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('referral-invite-copy-code'));
    expect(engine.copyCode).toHaveBeenCalled();
  });

  it('uses copy fallback label when web share is unavailable', () => {
    renderPage(makeEngine({ webShareAvailable: false }));

    expect(screen.getByTestId('referral-invite-share')).toHaveTextContent(
      'referral.invite.copyLinkCta',
    );
  });

  it('renders Kakao share augment when available', () => {
    renderPage(makeEngine({ kakaoShareAvailable: true }));

    expect(screen.getByTestId('referral-invite-kakao')).toHaveTextContent('earn.referral.kakao');
  });
});
