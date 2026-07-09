import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { FuturesPositionsPage } from '@/product/surfaces/trade/futures-positions-page';

export const Route = createFileRoute('/trade/positions')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: TradePositionsRoutePage,
});

function TradePositionsRoutePage() {
  return <FuturesPositionsPage />;
}
