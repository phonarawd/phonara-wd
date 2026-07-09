import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { TierMePage } from '@/product/surfaces/tier/tier-me-page';

export const Route = createFileRoute('/tier/me')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: TierMePage,
});
