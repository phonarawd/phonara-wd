import { createRoute } from '@tanstack/react-router';
import { adminDeskRoute } from './admin-desk';
import { AdminLovableSurface } from '../presentation-import/admin/admin-lovable-surface';
import { ImportedAdminQueuesPage } from '../presentation-import/admin/pages/ImportedAdminQueuesPage';

export const Route = createRoute({
  getParentRoute: () => adminDeskRoute,
  path: '/queues',
  component: QueuesRoute,
});

function QueuesRoute() {
  return (
    <AdminLovableSurface>
      <ImportedAdminQueuesPage />
    </AdminLovableSurface>
  );
}
