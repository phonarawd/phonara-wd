import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { PresentationRoot } from '../presentation-import/presentation-root';
import { ImportedEarnPage } from '../presentation-import/pages/earn-page';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/earn',
  component: ImportedEarnRoute,
});

function ImportedEarnRoute() {
  return (
    <PresentationRoot>
      <ImportedEarnPage />
    </PresentationRoot>
  );
}
