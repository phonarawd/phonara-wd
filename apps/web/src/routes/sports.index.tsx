import { createFileRoute } from '@tanstack/react-router';

import { SportsPage } from '@/product/surfaces/sports/sports-page';

export const Route = createFileRoute('/sports/')({
  component: SportsHomeRoutePage,
});

function SportsHomeRoutePage() {
  return <SportsPage mode="home" />;
}
