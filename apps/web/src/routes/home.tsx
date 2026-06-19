import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { HomeLovableSurface } from '../presentation-import/home/home-lovable-surface';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/home',
  component: ImportedHomeRoute,
});

function ImportedHomeRoute() {
  return <HomeLovableSurface />;
}
