import { createFileRoute } from '@tanstack/react-router';

import { SportsPage } from '@/product/surfaces/sports/sports-page';

export const Route = createFileRoute('/sports/prematch')({
  component: SportsPrematchRoutePage,
});

function SportsPrematchRoutePage() {
  return <SportsPage mode="prematch" />;
}
