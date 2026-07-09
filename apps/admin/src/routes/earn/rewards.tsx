import { createFileRoute } from '@tanstack/react-router';

import { AdminEarnRewardsPage } from '@/product/surfaces/admin-earn-rewards-page';

export const Route = createFileRoute('/earn/rewards')({
  component: AdminEarnRewardsPage,
});
