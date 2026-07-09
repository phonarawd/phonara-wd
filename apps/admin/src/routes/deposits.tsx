import { createFileRoute } from '@tanstack/react-router';

import { AdminDepositsPage } from '@/product/surfaces/admin-deposits-page';

export const Route = createFileRoute('/deposits')({
  component: AdminDepositsPage,
});
