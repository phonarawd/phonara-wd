import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { AccountKycPage } from '@/product/surfaces/account/account-kyc-page';

export const Route = createFileRoute('/account/kyc')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: AccountKycPage,
});
