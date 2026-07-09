import { createFileRoute } from '@tanstack/react-router';

import { WithdrawHubPage } from '@/product/surfaces/wallet/withdraw-hub-page';

export const Route = createFileRoute('/wallet/withdraw/')({
  component: WithdrawHubPage,
});
