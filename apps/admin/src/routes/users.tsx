import { createFileRoute, Outlet, useRouterState } from '@tanstack/react-router';

import { AdminUsersPage } from '@/product/surfaces/admin-users-page';

/**
 * Users layout — must render `<Outlet />` so `/users/$userId/tier` mounts.
 * Index (`/users`) shows the list; child routes replace the list (earn-equivalent).
 */
function UsersLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isUsersIndex = pathname === '/users' || pathname === '/users/';

  return (
    <>
      {isUsersIndex ? <AdminUsersPage /> : null}
      <Outlet />
    </>
  );
}

export const Route = createFileRoute('/users')({
  component: UsersLayout,
});
