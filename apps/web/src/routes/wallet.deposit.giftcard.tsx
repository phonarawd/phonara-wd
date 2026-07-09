import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { GiftcardDepositPage } from '@/product/surfaces/wallet/giftcard-deposit-page';

export const Route = createFileRoute('/wallet/deposit/giftcard')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: GiftcardDepositPage,
});
