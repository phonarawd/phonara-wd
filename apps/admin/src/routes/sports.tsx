import { createFileRoute } from '@tanstack/react-router';

import { AdminSportsPage } from '@/product/surfaces/admin-sports-page';

export const Route = createFileRoute('/sports')({
  component: AdminSportsPage,
});
