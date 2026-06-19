import { createRoute } from '@tanstack/react-router';
import { adminDeskRoute } from './admin-desk';
import { AdminLovableSurface } from '../presentation-import/admin/admin-lovable-surface';
import { ImportedAdminCasinoPage } from '../presentation-import/admin/pages/ImportedAdminCasinoPage';

export const Route = createRoute({
  getParentRoute: () => adminDeskRoute,
  path: '/casino',
  component: CasinoRoute,
});

function CasinoRoute() {
  return (
    <AdminLovableSurface>
      <ImportedAdminCasinoPage />
    </AdminLovableSurface>
  );
}
