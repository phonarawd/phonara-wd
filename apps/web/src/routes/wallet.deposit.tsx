import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';

type DepositHubSearch = {
  tab?: 'history';
};

function DepositRouteLayout() {
  return <Outlet />;
}

export const Route = createFileRoute('/wallet/deposit')({
  validateSearch: (search: Record<string, unknown>): DepositHubSearch => ({
    tab: search['tab'] === 'history' ? 'history' : undefined,
  }),
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: DepositRouteLayout,
});
