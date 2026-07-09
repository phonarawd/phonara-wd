import { createFileRoute } from '@tanstack/react-router';

import { SpotDeskPage } from '@/product/surfaces/trade/spot-desk-page';

export const Route = createFileRoute('/trade/')({
  component: TradeIndexRoutePage,
});

function TradeIndexRoutePage() {
  return <SpotDeskPage />;
}
