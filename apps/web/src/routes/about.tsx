import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { PresentationRoot } from '../presentation-import/presentation-root';
import { ImportedAboutPage } from '../presentation-import/pages/about-page';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: ImportedAboutRoute,
});

function ImportedAboutRoute() {
  return (
    <PresentationRoot>
      <ImportedAboutPage />
    </PresentationRoot>
  );
}
