import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { PresentationRoot } from '../presentation-import/presentation-root';
import { ImportedPWAInstallPage } from '../presentation-import/pages/install-page';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/install',
  component: InstallRoute,
});

function InstallRoute() {
  return (
    <PresentationRoot>
      <ImportedPWAInstallPage />
    </PresentationRoot>
  );
}
