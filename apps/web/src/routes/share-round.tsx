import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { PresentationRoot } from '../presentation-import/presentation-root';
import { ImportedShareRoundPage } from '../presentation-import/pages/share-round-page';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/share-round',
  component: ShareRoundRoute,
});

function ShareRoundRoute() {
  return (
    <PresentationRoot>
      <ImportedShareRoundPage />
    </PresentationRoot>
  );
}
