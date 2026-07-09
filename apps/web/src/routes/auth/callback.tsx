import { createFileRoute } from '@tanstack/react-router';

import { AuthCallbackPage } from '@/product/surfaces/auth/auth-callback-page';

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallbackPage,
});
