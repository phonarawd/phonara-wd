import { createFileRoute } from '@tanstack/react-router';

import { SportsPage } from '@/product/surfaces/sports/sports-page';

export const Route = createFileRoute('/sports/vip')({
  component: SportsVipRoutePage,
});

function SportsVipRoutePage() {
  return <SportsPage mode="vip" />;
}
