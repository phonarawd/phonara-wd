import { createFileRoute } from '@tanstack/react-router';

import { AdminEarnPage } from '@/product/surfaces/admin-earn-page';

export const Route = createFileRoute('/earn/')({
  component: AdminEarnPage,
});
