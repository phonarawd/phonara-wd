import { createRoute } from '@tanstack/react-router';
import { adminDeskRoute } from './admin-desk';
import { AdminLovableSurface } from '../presentation-import/admin/admin-lovable-surface';
import { ImportedAdminUsersPage } from '../presentation-import/admin/pages/ImportedAdminUsersPage';

export const Route = createRoute({
  getParentRoute: () => adminDeskRoute,
  path: '/users',
  component: UsersRoute,
});

function UsersRoute() {
  return (
    <AdminLovableSurface>
      <ImportedAdminUsersPage />
    </AdminLovableSurface>
  );
}
