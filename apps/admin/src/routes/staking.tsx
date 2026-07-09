import { createFileRoute } from '@tanstack/react-router';

import { AdminStakingPage } from '@/product/surfaces/admin-staking-page';

export const Route = createFileRoute('/staking')({
  component: AdminStakingPage,
});
