import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { PresentationRoot } from '../presentation-import/presentation-root';
import { ImportedSettingsPage } from '../presentation-import/pages/settings-page';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: ImportedSettingsRoute,
});

function ImportedSettingsRoute() {
  return (
    <PresentationRoot>
      <ImportedSettingsPage />
    </PresentationRoot>
  );
}
