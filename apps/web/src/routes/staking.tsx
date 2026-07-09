import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { StakingHubPage } from '@/product/surfaces/staking/staking-hub-page';

export const Route = createFileRoute('/staking')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: StakingRoutePage,
});

function StakingRoutePage() {
  return <StakingHubPage />;
}
