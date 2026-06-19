import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { PresentationRoot } from '../presentation-import/presentation-root';
import { ImportedMorePage } from '../presentation-import/pages/more-page';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/more',
  component: ImportedMoreRoute,
});

function ImportedMoreRoute() {
  return (
    <PresentationRoot>
      <ImportedMorePage />
    </PresentationRoot>
  );
}
