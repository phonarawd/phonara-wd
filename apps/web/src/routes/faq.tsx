import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { PresentationRoot } from '../presentation-import/presentation-root';
import { ImportedFAQPage } from '../presentation-import/pages/faq-page';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/faq',
  component: FaqRoute,
});

function FaqRoute() {
  return (
    <PresentationRoot>
      <ImportedFAQPage />
    </PresentationRoot>
  );
}
