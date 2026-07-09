import { createFileRoute } from '@tanstack/react-router';

import { SportsPage } from '@/product/surfaces/sports/sports-page';

export const Route = createFileRoute('/sports/live')({
  component: SportsLiveRoutePage,
});

function SportsLiveRoutePage() {
  return <SportsPage mode="live" />;
}
