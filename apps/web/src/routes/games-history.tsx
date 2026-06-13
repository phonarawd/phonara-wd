import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { PresentationRoot } from '../presentation-import/presentation-root';
import { ImportedGamesHistoryPage } from '../presentation-import/pages/games-history-page';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/games/history',
  component: ImportedGamesHistoryRoute,
});

function ImportedGamesHistoryRoute() {
  return (
    <PresentationRoot>
      <ImportedGamesHistoryPage />
    </PresentationRoot>
  );
}
