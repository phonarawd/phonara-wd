import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { KrwDepositPage } from '@/product/surfaces/wallet/krw-deposit-page';

export const Route = createFileRoute('/wallet/deposit/krw')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: KrwDepositPage,
});
