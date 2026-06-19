import { createRoute } from '@tanstack/react-router';
import { adminDeskRoute } from './admin-desk';
import { AdminLovableSurface } from '../presentation-import/admin/admin-lovable-surface';
import { ImportedAdminMfaPage } from '../presentation-import/admin/pages/ImportedAdminMfaPage';

export const Route = createRoute({
  getParentRoute: () => adminDeskRoute,
  path: '/mfa/policy',
  component: MfaPolicyRoute,
});

function MfaPolicyRoute() {
  return (
    <AdminLovableSurface>
      <ImportedAdminMfaPage />
    </AdminLovableSurface>
  );
}
