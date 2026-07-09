import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { OnboardingMissionsPage } from '@/product/surfaces/onboarding/onboarding-missions-page';

const useOnboardingMissionsPageControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/onboarding/use-onboarding-missions-page-controller', () => ({
  useOnboardingMissionsPageController: useOnboardingMissionsPageControllerMock,
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

function buildEngine(overrides: Partial<ReturnType<typeof baseEngine>> = {}) {
  return { ...baseEngine(), ...overrides };
}

function baseEngine() {
  return {
    t: (key: string, params?: Record<string, string | number>) => {
      if (key === 'onboarding.missions.progress' && params) {
        return `${params.completed} / ${params.total} 완료`;
      }
      if (key === 'onboarding.tier.bronzeGoal' && params) {
        return `브론즈 · ${params.xp} XP`;
      }
      const labels: Record<string, string> = {
        'seo.onboarding.missions.title': '첫 미션 — PHONARA',
        'onboarding.missions.dayEyebrow': 'Day 0',
        'onboarding.missions.pageTitle': '첫 미션',
        'onboarding.missions.subtitle':
          '환영 보너스와 간단한 미션으로 브론즈 등급을 향해 출발해요.',
        'onboarding.tier.eyebrow': '내 등급',
        'onboarding.tier.starterLabel': 'Starter',
        'onboarding.tier.starterDesc':
          '가입 직후 시작 등급이에요. 미션으로 XP를 모으면 브론즈로 올라가요.',
        'onboarding.tier.nextLabel': '다음 목표',
        'onboarding.tier.progressHint': '첫 미션을 완료하면 빠르게 올라갈 수 있어요.',
        'onboarding.missions.welcome.title': '환영 보너스 받기',
        'onboarding.missions.welcome.desc': '가입 즉시 받을 수 있는 PHON 보너스예요.',
        'onboarding.missions.profile.title': '프로필 완성',
        'onboarding.missions.profile.desc': '닉네임을 설정하면 추가 보상 미션이 완료돼요.',
        'onboarding.missions.share.title': '친구에게 공유하기',
        'onboarding.missions.share.desc': '초대 링크를 공유하고 바이럴 미션 보상을 받아보세요.',
        'onboarding.missions.claimWelcome': '보너스 받기',
        'onboarding.missions.continue': '이어하기',
        'onboarding.missions.completed': '완료',
        'onboarding.missions.finish': 'PHONARA 시작하기',
        'onboarding.missions.finishWithoutClaim': '나중에 받고 시작하기',
        'onboarding.missions.skip': '건너뛰기',
        'onboarding.missions.claiming': '지급 중...',
      };
      return labels[key] ?? key;
    },
    loading: false,
    claiming: false,
    error: null,
    missions: [
      {
        id: 'welcome-bonus' as const,
        titleKey: 'onboarding.missions.welcome.title' as const,
        descKey: 'onboarding.missions.welcome.desc' as const,
        engine: 'exists' as const,
        continueRoute: null,
        state: 'reward_pending' as const,
        rewardLabel: '—',
      },
      {
        id: 'growth-completeProfile' as const,
        titleKey: 'onboarding.missions.profile.title' as const,
        descKey: 'onboarding.missions.profile.desc' as const,
        engine: 'partial' as const,
        continueRoute: '/account',
        state: 'in_progress' as const,
        rewardLabel: '—',
      },
      {
        id: 'viral-shareLink' as const,
        titleKey: 'onboarding.missions.share.title' as const,
        descKey: 'onboarding.missions.share.desc' as const,
        engine: 'partial' as const,
        continueRoute: '/home',
        state: 'in_progress' as const,
        rewardLabel: '+25P',
      },
    ],
    completedCount: 0,
    missionCount: 3 as const,
    welcomeClaimed: false,
    claimWelcomeBonus: vi.fn(),
    finish: vi.fn(),
    skip: vi.fn(),
  };
}

function renderPage(engine = buildEngine()) {
  useOnboardingMissionsPageControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <OnboardingMissionsPage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  useOnboardingMissionsPageControllerMock.mockReset();
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('OnboardingMissionsPage', () => {
  it('renders Day 0 mission cards and welcome claim CTA', () => {
    renderPage();

    expect(screen.getByTestId('onboarding-missions-page')).toBeInTheDocument();
    expect(screen.getByTestId('onboarding-missions-tier-card')).toBeInTheDocument();
    expect(screen.getByText('0 / 3 완료')).toBeInTheDocument();
    expect(screen.getByTestId('onboarding-mission-welcome-bonus')).toBeInTheDocument();
    expect(screen.getByTestId('onboarding-missions-claim-welcome')).toHaveTextContent(
      '보너스 받기',
    );
    expect(
      screen.getByTestId('onboarding-mission-continue-growth-completeProfile'),
    ).toHaveAttribute('href', '/account');
  });

  it('shows loading skeleton while status resolves', () => {
    renderPage(buildEngine({ loading: true }));

    expect(screen.getByTestId('onboarding-missions-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('onboarding-missions-page')).not.toBeInTheDocument();
  });

  it('calls claimWelcomeBonus from welcome CTA', () => {
    const claimWelcomeBonus = vi.fn();
    renderPage(buildEngine({ claimWelcomeBonus }));

    fireEvent.click(screen.getByTestId('onboarding-missions-claim-welcome'));
    expect(claimWelcomeBonus).toHaveBeenCalled();
  });

  it('calls finish from primary CTA', () => {
    const finish = vi.fn();
    renderPage(buildEngine({ finish, welcomeClaimed: true }));

    fireEvent.click(screen.getByTestId('onboarding-missions-finish'));
    expect(finish).toHaveBeenCalled();
  });
});
