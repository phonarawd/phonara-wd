import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';

type WithdrawHubSearch = {
  tab?: 'history';
};

function WithdrawRouteLayout() {
  return <Outlet />;
}

export const Route = createFileRoute('/wallet/withdraw')({
  validateSearch: (search: Record<string, unknown>): WithdrawHubSearch => ({
    tab: search['tab'] === 'history' ? 'history' : undefined,
  }),
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: WithdrawRouteLayout,
});
