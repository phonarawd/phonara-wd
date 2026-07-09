import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { OnboardingPage } from '@/product/surfaces/onboarding/onboarding-page';

const useOnboardingPageControllerMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/onboarding/use-onboarding-page-controller', () => ({
  useOnboardingPageController: useOnboardingPageControllerMock,
}));

function buildEngine(overrides: Partial<ReturnType<typeof baseEngine>> = {}) {
  return { ...baseEngine(), ...overrides };
}

function baseEngine() {
  return {
    t: (key: string, params?: Record<string, string | number>) => {
      if (key === 'onboarding.flow.progress' && params) {
        return `${params.current} / ${params.total}단계`;
      }
      if (key === 'onboarding.tier.bronzeGoal' && params) {
        return `브론즈 · ${params.xp} XP`;
      }
      const labels: Record<string, string> = {
        'seo.onboarding.title': '시작 가이드 — PHONARA',
        'onboarding.flow.pageTitle': '시작 가이드',
        'onboarding.flow.subtitle': 'Earn → Wallet → Play, 세 축으로 빠르게 시작해요.',
        'onboarding.tier.eyebrow': '내 등급',
        'onboarding.tier.starterLabel': 'Starter',
        'onboarding.tier.starterDesc':
          '가입 직후 시작 등급이에요. 미션으로 XP를 모으면 브론즈로 올라가요.',
        'onboarding.tier.nextLabel': '다음 목표',
        'onboarding.tier.progressHint': '첫 미션을 완료하면 빠르게 올라갈 수 있어요.',
        'platform.pillars.earn.title': '1. Earn',
        'platform.pillars.earn.desc': '미션·출석·추천으로 오늘부터 0원으로 시작해요.',
        'platform.pillars.wallet.title': '2. Wallet',
        'platform.pillars.wallet.desc': 'PHON 잔액은 하나의 리워드 지갑에서 확인해요.',
        'platform.pillars.play.title': '3. Play',
        'platform.pillars.play.desc': '거래·스포츠 등 실활동은 준비되면 같은 지갑에서 이어져요.',
        'onboarding.flow.next': '다음',
        'onboarding.flow.back': '이전',
        'onboarding.flow.skip': '건너뛰기',
        'onboarding.flow.finish': 'PHONARA 시작하기',
      };
      return labels[key] ?? key;
    },
    loading: false,
    step: 1 as const,
    stepCount: 3 as const,
    steps: [
      { titleKey: 'platform.pillars.earn.title', descKey: 'platform.pillars.earn.desc' },
      { titleKey: 'platform.pillars.wallet.title', descKey: 'platform.pillars.wallet.desc' },
      { titleKey: 'platform.pillars.play.title', descKey: 'platform.pillars.play.desc' },
    ],
    bronzeXpGoal: 5000,
    isFirstStep: true,
    isLastStep: false,
    goNext: vi.fn(),
    goBack: vi.fn(),
    skip: vi.fn(),
    finish: vi.fn(),
  };
}

function renderPage(engine = buildEngine()) {
  useOnboardingPageControllerMock.mockReturnValue(engine);
  return render(
    <I18nProvider>
      <OnboardingPage />
    </I18nProvider>,
  );
}

beforeEach(() => {
  useOnboardingPageControllerMock.mockReset();
  window.localStorage.setItem('phonara.locale', 'ko');
});

describe('OnboardingPage', () => {
  it('renders tier handoff card and first step content', () => {
    renderPage();

    expect(screen.getByTestId('onboarding-page')).toBeInTheDocument();
    expect(screen.getByTestId('onboarding-tier-card')).toBeInTheDocument();
    expect(screen.getByText('Starter')).toBeInTheDocument();
    expect(screen.getByText('브론즈 · 5,000 XP')).toBeInTheDocument();
    expect(screen.getByTestId('onboarding-step-title')).toHaveTextContent('1. Earn');
    expect(screen.getByTestId('onboarding-primary-cta')).toHaveTextContent('다음');
  });

  it('shows loading skeleton while auth resolves', () => {
    renderPage(buildEngine({ loading: true }));

    expect(screen.getByTestId('onboarding-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('onboarding-page')).not.toBeInTheDocument();
  });

  it('calls goNext from primary CTA', () => {
    const goNext = vi.fn();
    renderPage(buildEngine({ goNext }));

    fireEvent.click(screen.getByTestId('onboarding-primary-cta'));
    expect(goNext).toHaveBeenCalled();
  });

  it('shows finish label and back button on last step', () => {
    renderPage(
      buildEngine({
        step: 3,
        isFirstStep: false,
        isLastStep: true,
      }),
    );

    expect(screen.getByTestId('onboarding-primary-cta')).toHaveTextContent('PHONARA 시작하기');
    expect(screen.getByTestId('onboarding-back')).toBeInTheDocument();
    expect(screen.getByTestId('onboarding-step-title')).toHaveTextContent('3. Play');
  });

  it('calls skip from skip control', () => {
    const skip = vi.fn();
    renderPage(buildEngine({ skip }));

    fireEvent.click(screen.getByTestId('onboarding-skip'));
    expect(skip).toHaveBeenCalled();
  });
});
