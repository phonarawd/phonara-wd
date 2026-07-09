import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import {
  ONBOARDING_COMPLETE_ROUTE,
  ONBOARDING_MISSIONS_ROUTE,
  ONBOARDING_STEP_COUNT,
} from '@/domain/onboarding-handoff-display-contract';
import {
  PLATFORM_PILLAR_CONTENT,
  PLATFORM_PILLAR_IDS,
} from '@/domain/platform-narrative-display-contract';
import { EARN_VIP_XP_NEXT_TIER } from '@/domain/unified-tier-display-contract';
import { isOnboardingComplete, markOnboardingComplete } from '@/lib/onboarding-funnel';
import { useT } from '@/product/i18n';

export type OnboardingStep = 1 | 2 | 3;

export type OnboardingStepContent = {
  titleKey: MessageKey;
  descKey: MessageKey;
};

export const ONBOARDING_STEPS: readonly OnboardingStepContent[] = PLATFORM_PILLAR_IDS.map(
  (pillarId) => {
    const pillar = PLATFORM_PILLAR_CONTENT[pillarId];
    return {
      titleKey: pillar.titleKey,
      descKey: pillar.descKey,
    };
  },
);

export type OnboardingPageControllerView = {
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  loading: boolean;
  step: OnboardingStep;
  stepCount: typeof ONBOARDING_STEP_COUNT;
  steps: readonly OnboardingStepContent[];
  bronzeXpGoal: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  goNext: () => void;
  goBack: () => void;
  skip: () => void;
  finish: () => void;
};

export function useOnboardingPageController(): OnboardingPageControllerView {
  const t = useT();
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [step, setStep] = useState<OnboardingStep>(1);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      void navigate({ to: '/login', replace: true });
      return;
    }
    if (isOnboardingComplete(session.user.id)) {
      void navigate({ to: ONBOARDING_COMPLETE_ROUTE, replace: true });
    }
  }, [loading, navigate, session]);

  const isFirstStep = step === 1;
  const isLastStep = step === ONBOARDING_STEP_COUNT;

  const goNext = () => {
    if (isLastStep) {
      finish();
      return;
    }
    setStep((current) => (current + 1) as OnboardingStep);
  };

  const goBack = () => {
    if (isFirstStep) return;
    setStep((current) => (current - 1) as OnboardingStep);
  };

  const skip = () => {
    const userId = session?.user.id;
    if (!userId) return;
    markOnboardingComplete(userId);
    void navigate({ to: ONBOARDING_COMPLETE_ROUTE, replace: true });
  };

  const finish = () => {
    if (!session?.user.id) return;
    void navigate({ to: ONBOARDING_MISSIONS_ROUTE as never, replace: true });
  };

  return {
    t,
    loading,
    step,
    stepCount: ONBOARDING_STEP_COUNT,
    steps: ONBOARDING_STEPS,
    bronzeXpGoal: EARN_VIP_XP_NEXT_TIER.bronze,
    isFirstStep,
    isLastStep,
    goNext,
    goBack,
    skip,
    finish,
  };
}
