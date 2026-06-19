import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { ResetPasswordLovableSurface } from '../presentation-import/auth/reset-password-lovable-surface';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reset-password',
  component: ResetPasswordLovableSurface,
});
