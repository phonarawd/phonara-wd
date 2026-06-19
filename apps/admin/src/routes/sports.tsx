import { createRoute } from '@tanstack/react-router';
import { adminDeskRoute } from './admin-desk';
import { AdminLovableSurface } from '../presentation-import/admin/admin-lovable-surface';
import { ImportedAdminSportsPage } from '../presentation-import/admin/pages/ImportedAdminSportsPage';

export const Route = createRoute({
  getParentRoute: () => adminDeskRoute,
  path: '/sports',
  component: SportsRoute,
});

function SportsRoute() {
  return (
    <AdminLovableSurface>
      <ImportedAdminSportsPage />
    </AdminLovableSurface>
  );
}
