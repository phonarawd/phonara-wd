import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { AccountHubPage } from '@/product/surfaces/account/account-hub-page';

export const Route = createFileRoute('/account/')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: AccountRoutePage,
});

function AccountRoutePage() {
  return <AccountHubPage />;
}
