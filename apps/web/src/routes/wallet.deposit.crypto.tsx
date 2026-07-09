import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { CryptoDepositPage } from '@/product/surfaces/wallet/crypto-deposit-page';

export const Route = createFileRoute('/wallet/deposit/crypto')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: CryptoDepositPage,
});
