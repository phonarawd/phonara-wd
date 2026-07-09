import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { CasinoHubDeferPage } from '@/product/surfaces/casino/casino-hub-defer-page';

export const Route = createFileRoute('/casino')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: CasinoRoutePage,
});

function CasinoRoutePage() {
  return <CasinoHubDeferPage />;
}
