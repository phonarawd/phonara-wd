import { createFileRoute } from '@tanstack/react-router';

import { AdminWithdrawalsPage } from '@/product/surfaces/admin-withdrawals-page';

export const Route = createFileRoute('/withdrawals')({
  component: AdminWithdrawalsPage,
});
