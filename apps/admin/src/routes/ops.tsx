import { createFileRoute } from '@tanstack/react-router';

import { AdminOpsPage } from '@/product/surfaces/admin-ops-page';

export const Route = createFileRoute('/ops')({
  component: AdminOpsPage,
});
