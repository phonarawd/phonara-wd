import { createFileRoute } from '@tanstack/react-router';

import { SportsPage } from '@/product/surfaces/sports/sports-page';

export const Route = createFileRoute('/sports/my-bets')({
  component: SportsMyBetsRoutePage,
});

function SportsMyBetsRoutePage() {
  return <SportsPage mode="my-bets" />;
}
