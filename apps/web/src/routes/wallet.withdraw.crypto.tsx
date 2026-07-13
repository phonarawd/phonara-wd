import { createFileRoute, redirect } from '@tanstack/react-router';

import { shouldRedirectCryptoWithdrawRoute } from '@/domain/wallet-capability-rails-display-contract';
import { getSession } from '@/lib/auth';
import { LAUNCH_GATES } from '@/lib/launch-gates';
import { CryptoWithdrawPage } from '@/product/surfaces/wallet/crypto-withdraw-page';

export const Route = createFileRoute('/wallet/withdraw/crypto')({
  beforeLoad: async () => {
    if (shouldRedirectCryptoWithdrawRoute(LAUNCH_GATES.cryptoRails)) {
      throw redirect({ to: '/wallet/withdraw', replace: true });
    }
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: CryptoWithdrawPage,
});
