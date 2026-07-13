import { createFileRoute, redirect } from '@tanstack/react-router';

import { shouldRedirectCryptoDepositRoute } from '@/domain/wallet-capability-rails-display-contract';
import { getSession } from '@/lib/auth';
import { LAUNCH_GATES } from '@/lib/launch-gates';
import { CryptoDepositPage } from '@/product/surfaces/wallet/crypto-deposit-page';

export const Route = createFileRoute('/wallet/deposit/crypto')({
  beforeLoad: async () => {
    if (shouldRedirectCryptoDepositRoute(LAUNCH_GATES.cryptoRails)) {
      throw redirect({ to: '/wallet/deposit', replace: true });
    }
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: CryptoDepositPage,
});
