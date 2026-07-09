import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { isOnboardingComplete } from '@/lib/onboarding-funnel';
import { ONBOARDING_COMPLETE_ROUTE } from '@/domain/onboarding-handoff-display-contract';
import { OnboardingMissionsPage } from '@/product/surfaces/onboarding/onboarding-missions-page';

export const Route = createFileRoute('/onboarding/missions')({
  beforeLoad: async () => {
    const session = await getSession();
    if (session && isOnboardingComplete(session.user.id)) {
      throw redirect({ to: ONBOARDING_COMPLETE_ROUTE, replace: true });
    }
  },
  component: OnboardingMissionsRoutePage,
});

function OnboardingMissionsRoutePage() {
  return <OnboardingMissionsPage />;
}
