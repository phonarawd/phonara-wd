import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { StakingPositionsPage } from '@/product/surfaces/staking/staking-positions-page';

export const Route = createFileRoute('/staking/positions')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: StakingPositionsRoutePage,
});

function StakingPositionsRoutePage() {
  return <StakingPositionsPage />;
}
