import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';

export const Route = createFileRoute('/casino')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: CasinoRouteLayout,
});

function CasinoRouteLayout() {
  return <Outlet />;
}
