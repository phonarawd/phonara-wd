import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { PresentationRoot } from '../presentation-import/presentation-root';
import { ImportedPrivacyPage } from '../presentation-import/pages/privacy-page';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/privacy',
  component: ImportedPrivacyRoute,
});

function ImportedPrivacyRoute() {
  return (
    <PresentationRoot>
      <ImportedPrivacyPage />
    </PresentationRoot>
  );
}
