import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { EarnPlayPage } from '@/product/surfaces/earn/earn-play-page';

export const Route = createFileRoute('/earn/play')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: EarnPlayPage,
});
