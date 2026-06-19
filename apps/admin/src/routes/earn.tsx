import { createRoute } from '@tanstack/react-router';
import { adminDeskRoute } from './admin-desk';
import { AdminLovableSurface } from '../presentation-import/admin/admin-lovable-surface';
import { ImportedAdminEarnPage } from '../presentation-import/admin/pages/ImportedAdminEarnPage';

export const Route = createRoute({
  getParentRoute: () => adminDeskRoute,
  path: '/earn',
  component: EarnRoute,
});

function EarnRoute() {
  return (
    <AdminLovableSurface>
      <ImportedAdminEarnPage />
    </AdminLovableSurface>
  );
}
