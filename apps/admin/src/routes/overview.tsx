import { createRoute } from '@tanstack/react-router';
import { adminDeskRoute } from './admin-desk';
import { AdminLovableSurface } from '../presentation-import/admin/admin-lovable-surface';
import { ImportedAdminOverviewPage } from '../presentation-import/admin/pages/ImportedAdminOverviewPage';

export const Route = createRoute({
  getParentRoute: () => adminDeskRoute,
  path: '/overview',
  component: OverviewRoute,
});

function OverviewRoute() {
  return (
    <AdminLovableSurface>
      <ImportedAdminOverviewPage />
    </AdminLovableSurface>
  );
}
