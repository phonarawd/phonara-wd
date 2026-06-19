import { createRoute, Navigate } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';

/** Admin SPA entry — `/` has no desk; send operators to login. */
export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: AdminIndexRedirect,
});

function AdminIndexRedirect() {
  return <Navigate to="/login" replace />;
}
