import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';

export const Route = createFileRoute('/sports')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: SportsRouteLayout,
});

function SportsRouteLayout() {
  return <Outlet />;
}
