import { createFileRoute } from '@tanstack/react-router';

import { SportsPage } from '@/product/surfaces/sports/sports-page';

export const Route = createFileRoute('/sports/fixture/$fixtureId')({
  component: SportsFixtureRoutePage,
});

function SportsFixtureRoutePage() {
  const { fixtureId } = Route.useParams();
  return <SportsPage mode="fixture" fixtureId={fixtureId} />;
}
