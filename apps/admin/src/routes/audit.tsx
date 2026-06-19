import { createRoute } from '@tanstack/react-router';
import { adminDeskRoute } from './admin-desk';
import { AdminLovableSurface } from '../presentation-import/admin/admin-lovable-surface';
import { ImportedAdminAuditPage } from '../presentation-import/admin/pages/ImportedAdminAuditPage';

export const Route = createRoute({
  getParentRoute: () => adminDeskRoute,
  path: '/audit',
  component: AuditRoute,
});

function AuditRoute() {
  return (
    <AdminLovableSurface>
      <ImportedAdminAuditPage />
    </AdminLovableSurface>
  );
}
