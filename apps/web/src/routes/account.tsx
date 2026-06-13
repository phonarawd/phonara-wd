import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { PresentationRoot } from '../presentation-import/presentation-root';
import { ImportedAccountPage } from '../presentation-import/pages/account-page';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/account',
  component: ImportedAccountRoute,
});

function ImportedAccountRoute() {
  return (
    <PresentationRoot>
      <ImportedAccountPage />
    </PresentationRoot>
  );
}
