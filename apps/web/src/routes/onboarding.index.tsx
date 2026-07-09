import { createFileRoute, redirect } from '@tanstack/react-router';

import { ONBOARDING_COMPLETE_ROUTE } from '@/domain/onboarding-handoff-display-contract';
import { OnboardingPage } from '@/product/surfaces/onboarding/onboarding-page';
import { getSession } from '@/lib/auth';
import { isOnboardingComplete } from '@/lib/onboarding-funnel';

export const Route = createFileRoute('/onboarding/')({
  beforeLoad: async () => {
    const session = await getSession();
    if (session && isOnboardingComplete(session.user.id)) {
      throw redirect({ to: ONBOARDING_COMPLETE_ROUTE, replace: true });
    }
  },
  component: OnboardingRoutePage,
});

function OnboardingRoutePage() {
  return <OnboardingPage />;
}
