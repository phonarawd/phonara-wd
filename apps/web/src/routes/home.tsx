import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { PresentationRoot } from '../presentation-import/presentation-root';
import { ImportedHomePage } from '../presentation-import/pages/home-page';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/home',
  component: ImportedHomeRoute,
});

function ImportedHomeRoute() {
  return (
    <PresentationRoot>
      <ImportedHomePage />
    </PresentationRoot>
  );
}
