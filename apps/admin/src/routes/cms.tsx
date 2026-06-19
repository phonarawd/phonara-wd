import { createRoute } from '@tanstack/react-router';
import { adminDeskRoute } from './admin-desk';
import { AdminLovableSurface } from '../presentation-import/admin/admin-lovable-surface';
import { ImportedAdminCmsPage } from '../presentation-import/admin/pages/ImportedAdminCmsPage';

export const Route = createRoute({
  getParentRoute: () => adminDeskRoute,
  path: '/cms',
  component: CmsRoute,
});

function CmsRoute() {
  return (
    <AdminLovableSurface>
      <ImportedAdminCmsPage />
    </AdminLovableSurface>
  );
}
