import { createFileRoute } from '@tanstack/react-router';

import { AdminLoginPage } from '@/product/surfaces/admin-login-page';

export const Route = createFileRoute('/login')({
  component: AdminLoginPage,
});
