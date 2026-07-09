import { createFileRoute } from '@tanstack/react-router';

import { AdminViralStatsPage } from '@/product/surfaces/admin-viral-stats-page';

export const Route = createFileRoute('/viral-stats')({
  component: AdminViralStatsPage,
});
