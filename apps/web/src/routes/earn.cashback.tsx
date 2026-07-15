import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { EarnCashbackPage } from '@/product/surfaces/earn/earn-cashback-page';

export const Route = createFileRoute('/earn/cashback')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: EarnCashbackPage,
});
