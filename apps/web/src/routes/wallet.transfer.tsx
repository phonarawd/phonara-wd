import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { WalletTransferPage } from '@/product/surfaces/wallet/wallet-transfer-page';

export const Route = createFileRoute('/wallet/transfer')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: WalletTransferPage,
});
