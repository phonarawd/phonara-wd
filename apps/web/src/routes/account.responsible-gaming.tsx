import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { AccountResponsibleGamingPage } from '@/product/surfaces/account/account-responsible-gaming-page';

export const Route = createFileRoute('/account/responsible-gaming')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: AccountResponsibleGamingPage,
});
