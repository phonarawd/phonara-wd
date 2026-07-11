import { createFileRoute } from '@tanstack/react-router';

import { CookiesPage } from '@/product/surfaces/legal/cookies-page';

export const Route = createFileRoute('/legal/cookies')({
  component: CookiesPage,
});
