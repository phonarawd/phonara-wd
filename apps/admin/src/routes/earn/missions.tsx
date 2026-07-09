import { createFileRoute } from '@tanstack/react-router';

import { AdminEarnMissionsPage } from '@/product/surfaces/admin-earn-missions-page';

export const Route = createFileRoute('/earn/missions')({
  component: AdminEarnMissionsPage,
});
