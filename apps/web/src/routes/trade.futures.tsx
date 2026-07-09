import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { FuturesDeskPage } from '@/product/surfaces/trade/futures-desk-page';

export const Route = createFileRoute('/trade/futures')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: TradeFuturesRoutePage,
});

function TradeFuturesRoutePage() {
  return <FuturesDeskPage />;
}
