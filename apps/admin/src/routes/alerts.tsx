import { createRoute } from '@tanstack/react-router';
import { adminDeskRoute } from './admin-desk';
import { AdminLovableSurface } from '../presentation-import/admin/admin-lovable-surface';
import { ImportedAdminAlertsPage } from '../presentation-import/admin/pages/ImportedAdminAlertsPage';

export const Route = createRoute({
  getParentRoute: () => adminDeskRoute,
  path: '/alerts',
  component: AlertsRoute,
});

function AlertsRoute() {
  return (
    <AdminLovableSurface>
      <ImportedAdminAlertsPage />
    </AdminLovableSurface>
  );
}
