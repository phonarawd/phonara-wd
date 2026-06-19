import { createRoute } from '@tanstack/react-router';
import { adminDeskRoute } from './admin-desk';
import { AdminLovableSurface } from '../presentation-import/admin/admin-lovable-surface';
import { ImportedAdminSettingsPage } from '../presentation-import/admin/pages/ImportedAdminSettingsPage';

export const Route = createRoute({
  getParentRoute: () => adminDeskRoute,
  path: '/settings',
  component: SettingsRoute,
});

function SettingsRoute() {
  return (
    <AdminLovableSurface>
      <ImportedAdminSettingsPage />
    </AdminLovableSurface>
  );
}
