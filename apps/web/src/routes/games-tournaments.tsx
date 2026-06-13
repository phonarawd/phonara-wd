import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { PresentationRoot } from '../presentation-import/presentation-root';
import { ImportedGamesTournamentsPage } from '../presentation-import/pages/games-tournaments-page';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/games/tournaments',
  component: ImportedGamesTournamentsRoute,
});

function ImportedGamesTournamentsRoute() {
  return (
    <PresentationRoot>
      <ImportedGamesTournamentsPage />
    </PresentationRoot>
  );
}
