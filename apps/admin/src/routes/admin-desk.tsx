import { createRoute, Outlet } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { ImportedAdminShell } from '@/components/admin/ImportedAdminShell';

export const adminDeskRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'admin-desk',
  component: AdminDeskLayout,
});

function AdminDeskLayout() {
  return (
    <ImportedAdminShell>
      <Outlet />
    </ImportedAdminShell>
  );
}
