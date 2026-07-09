import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router';
import { useState } from 'react';

import { AuthProvider } from '@/contexts/auth-context';
import { isAdminAuthSurfacePath } from '@/domain/admin-post-auth';
import { useAdminRouteGate } from '@/hooks/use-admin-route-gate';
import { AdminShell } from '@/product/layout/admin-shell';
import { AdminForbiddenShell } from '@/product/surfaces/admin-forbidden-shell';
import { Skeleton } from '@/product/primitives/skeleton';
import { ShellPage } from '@/product/layout/content-shell';

function AdminDeskLoadingShell() {
  return (
    <ShellPage className="bg-background text-foreground min-h-dvh p-6">
      <div
        className="mx-auto flex w-full max-w-3xl flex-col gap-4"
        data-testid="admin-desk-loading"
      >
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </ShellPage>
  );
}

function AdminRouteGate({ children }: { children: React.ReactNode }) {
  const gate = useAdminRouteGate();

  if (gate.kind === 'forbidden') {
    return <AdminForbiddenShell />;
  }

  if (gate.kind === 'loading' || gate.kind === 'unauthenticated') {
    return <AdminDeskLoadingShell />;
  }

  return children;
}

function AdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (isAdminAuthSurfacePath(pathname)) {
    return children;
  }
  return <AdminShell>{children}</AdminShell>;
}

function RootLayout() {
  return (
    <AuthProvider>
      <AdminRouteGate>
        <AdminChrome>
          <Outlet />
        </AdminChrome>
      </AdminRouteGate>
    </AuthProvider>
  );
}

function AdminRootProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export const Route = createRootRoute({
  component: () => (
    <AdminRootProviders>
      <RootLayout />
    </AdminRootProviders>
  ),
});
