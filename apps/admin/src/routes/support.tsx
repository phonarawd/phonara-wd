import { createFileRoute } from '@tanstack/react-router';

import { AdminSupportPage } from '@/product/surfaces/admin-support-page';

export const Route = createFileRoute('/support')({
  component: AdminSupportPage,
});
