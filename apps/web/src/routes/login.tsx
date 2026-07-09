import { createFileRoute } from '@tanstack/react-router';

import { LoginPage } from '@/product/surfaces/login/login-page';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});
