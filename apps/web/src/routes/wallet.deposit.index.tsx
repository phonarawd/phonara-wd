import { createFileRoute } from '@tanstack/react-router';

import { DepositHubPage } from '@/product/surfaces/wallet/deposit-hub-page';

export const Route = createFileRoute('/wallet/deposit/')({
  component: DepositHubPage,
});
