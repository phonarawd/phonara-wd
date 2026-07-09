import { createFileRoute } from '@tanstack/react-router';

import { AdminRiskPage } from '@/product/surfaces/admin-risk-page';

export const Route = createFileRoute('/risk')({
  component: AdminRiskPage,
});
