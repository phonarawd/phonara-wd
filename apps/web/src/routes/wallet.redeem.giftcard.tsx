import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { GiftcardRedeemPage } from '@/product/surfaces/wallet/giftcard-redeem-page';

export const Route = createFileRoute('/wallet/redeem/giftcard')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: GiftcardRedeemPage,
});
