import { createFileRoute } from '@tanstack/react-router';

import { AdminTiersPage } from '@/product/surfaces/admin-tiers-page';

export const Route = createFileRoute('/tiers')({
  component: AdminTiersPage,
});
