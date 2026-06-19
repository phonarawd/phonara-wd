import { createRoute } from '@tanstack/react-router';
import { adminDeskRoute } from './admin-desk';
import { AdminLovableSurface } from '../presentation-import/admin/admin-lovable-surface';
import { ImportedAdminOperationsPage } from '../presentation-import/admin/pages/ImportedAdminOperationsPage';

export const Route = createRoute({
  getParentRoute: () => adminDeskRoute,
  path: '/operations',
  component: OperationsRoute,
});

function OperationsRoute() {
  return (
    <AdminLovableSurface>
      <ImportedAdminOperationsPage />
    </AdminLovableSurface>
  );
}
