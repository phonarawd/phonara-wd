import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';

import { KrwWithdrawPage } from '@/product/surfaces/wallet/krw-withdraw-page';

export const Route = createFileRoute('/wallet/withdraw/krw')({
  beforeLoad: async () => {
    const session = await getSession();

    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },

  component: KrwWithdrawPage,
});
