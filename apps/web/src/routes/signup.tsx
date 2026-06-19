import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { SignupLovableSurface } from '../presentation-import/auth/signup-lovable-surface';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/signup',
  component: SignupRoute,
});

function SignupRoute() {
  return <SignupLovableSurface />;
}
