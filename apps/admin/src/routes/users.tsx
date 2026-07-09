import { createFileRoute } from '@tanstack/react-router';

import { AdminUsersPage } from '@/product/surfaces/admin-users-page';

export const Route = createFileRoute('/users')({
  component: AdminUsersPage,
});
