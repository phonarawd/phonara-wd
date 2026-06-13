import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { PresentationRoot } from '../presentation-import/presentation-root';
import { ImportedTermsPage } from '../presentation-import/pages/terms-page';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/terms',
  component: ImportedTermsRoute,
});

function ImportedTermsRoute() {
  return (
    <PresentationRoot>
      <ImportedTermsPage />
    </PresentationRoot>
  );
}
