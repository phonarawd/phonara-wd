import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { LoginLovableSurface } from '../presentation-import/auth/login-lovable-surface';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginRoute,
});

function LoginRoute() {
  return <LoginLovableSurface />;
}
