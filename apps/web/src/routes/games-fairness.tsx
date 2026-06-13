import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { PresentationRoot } from '../presentation-import/presentation-root';
import { ImportedGamesFairnessPage } from '../presentation-import/pages/games-fairness-page';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/games/fairness',
  component: ImportedGamesFairnessRoute,
});

function ImportedGamesFairnessRoute() {
  return (
    <PresentationRoot>
      <ImportedGamesFairnessPage />
    </PresentationRoot>
  );
}
