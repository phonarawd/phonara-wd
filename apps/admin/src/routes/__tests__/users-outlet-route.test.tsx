import { render, screen, waitFor } from '@testing-library/react';
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  useRouterState,
} from '@tanstack/react-router';
import { beforeAll, describe, expect, it } from 'vitest';

beforeAll(() => {
  // jsdom lacks scrollTo; TanStack Router scroll restoration calls it.
  window.scrollTo = () => undefined;
});

/**
 * C2 regression: parent `/users` must render `<Outlet />` so `/users/$userId/tier` mounts.
 * Mirrors production `UsersLayout` (index list XOR child desk).
 */
describe('users layout Outlet (C2)', () => {
  it('mounts /users/$userId/tier child when parent renders Outlet', async () => {
    const rootRoute = createRootRoute({
      component: () => <Outlet />,
    });

    const usersRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/users',
      component: function UsersLayout() {
        const pathname = useRouterState({ select: (s) => s.location.pathname });
        const isUsersIndex = pathname === '/users' || pathname === '/users/';
        return (
          <>
            {isUsersIndex ? <div data-testid="users-index">users-list</div> : null}
            <Outlet />
          </>
        );
      },
    });

    const tierRoute = createRoute({
      getParentRoute: () => usersRoute,
      path: '/$userId/tier',
      component: function TierPage() {
        const { userId } = tierRoute.useParams();
        return <div data-testid="user-tier-page">tier:{userId}</div>;
      },
    });

    const routeTree = rootRoute.addChildren([usersRoute.addChildren([tierRoute])]);
    const history = createMemoryHistory({ initialEntries: ['/users/user-42/tier'] });
    const router = createRouter({ routeTree, history });

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByTestId('user-tier-page').textContent).toBe('tier:user-42');
    });
    expect(screen.queryByTestId('users-index')).toBeNull();
  });

  it('shows users index without requiring a child when path is /users', async () => {
    const rootRoute = createRootRoute({
      component: () => <Outlet />,
    });

    const usersRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/users',
      component: function UsersLayout() {
        const pathname = useRouterState({ select: (s) => s.location.pathname });
        const isUsersIndex = pathname === '/users' || pathname === '/users/';
        return (
          <>
            {isUsersIndex ? <div data-testid="users-index">users-list</div> : null}
            <Outlet />
          </>
        );
      },
    });

    const tierRoute = createRoute({
      getParentRoute: () => usersRoute,
      path: '/$userId/tier',
      component: () => <div data-testid="user-tier-page">tier</div>,
    });

    const routeTree = rootRoute.addChildren([usersRoute.addChildren([tierRoute])]);
    const history = createMemoryHistory({ initialEntries: ['/users'] });
    const router = createRouter({ routeTree, history });

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByTestId('users-index')).toBeTruthy();
    });
    expect(screen.queryByTestId('user-tier-page')).toBeNull();
  });
});
