import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { PresentationRoot } from '../presentation-import/presentation-root';
import { ImportedGamesCatalogPage } from '../presentation-import/pages/games-catalog-page';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/games',
  component: ImportedGamesRoute,
});

function ImportedGamesRoute() {
  return (
    <PresentationRoot>
      <ImportedGamesCatalogPage />
    </PresentationRoot>
  );
}
