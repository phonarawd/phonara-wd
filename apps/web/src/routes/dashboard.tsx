import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { DashboardLovableSurface } from '../presentation-import/dashboard/dashboard-lovable-surface';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: DashboardLovableSurface,
});
