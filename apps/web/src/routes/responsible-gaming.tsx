import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { RgLovableSurface } from '../presentation-import/responsible-gaming/rg-lovable-surface';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/responsible-gaming',
  component: RgLovableSurface,
});
