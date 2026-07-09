import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { FuturesOrdersPage } from '@/product/surfaces/trade/futures-orders-page';

export const Route = createFileRoute('/trade/orders')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: TradeOrdersRoutePage,
});

function TradeOrdersRoutePage() {
  return <FuturesOrdersPage />;
}
