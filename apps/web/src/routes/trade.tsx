import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';

function TradeRouteLayout() {
  return <Outlet />;
}

export const Route = createFileRoute('/trade')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: TradeRouteLayout,
});
