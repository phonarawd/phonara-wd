import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { AccountProfilePage } from '@/product/surfaces/account/account-profile-page';

export const Route = createFileRoute('/account/profile')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: AccountProfilePage,
});
