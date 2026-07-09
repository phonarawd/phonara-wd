import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { ShareEarningsPage } from '@/product/surfaces/share/share-earnings-page';

export const Route = createFileRoute('/share/earnings')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: ShareEarningsPage,
});
