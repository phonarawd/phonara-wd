import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { WalletRedeemPage } from '@/product/surfaces/wallet/wallet-redeem-page';

export const Route = createFileRoute('/wallet/redeem')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: WalletRedeemPage,
});
