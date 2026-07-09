import { createFileRoute } from '@tanstack/react-router';

import { AdminHomePage } from '@/product/surfaces/admin-home-page';

export const Route = createFileRoute('/')({
  component: AdminHomePage,
});
