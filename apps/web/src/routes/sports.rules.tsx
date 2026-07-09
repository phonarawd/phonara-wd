import { createFileRoute } from '@tanstack/react-router';

import { SportsPage } from '@/product/surfaces/sports/sports-page';

export const Route = createFileRoute('/sports/rules')({
  component: SportsRulesRoutePage,
});

function SportsRulesRoutePage() {
  return <SportsPage mode="rules" />;
}
