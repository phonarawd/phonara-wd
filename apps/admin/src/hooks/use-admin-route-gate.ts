import { useEffect, useState } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';

import { useAuth } from '@/contexts/auth-context';
import {
  adminDeskAccessRoute,
  isAdminAuthSurfacePath,
  resolveAdminDeskAccess,
} from '@/domain/admin-post-auth';
import { ADMIN_LOGIN_ROUTE } from '@/domain/admin-security-display-contract';
import { isAdminNavRouteAllowed } from '@/domain/admin-team-desk-display-contract';
import { useAdminOperatorRbac } from '@/hooks/admin/useAdminOperatorRbac';
import { signOutLocal } from '@/lib/auth';

export type AdminRouteGateView =
  | { kind: 'auth-surface' }
  | { kind: 'loading' }
  | { kind: 'unauthenticated' }
  | { kind: 'forbidden' }
  | { kind: 'ready' };

function normalizeDeskPath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

/** Map nested member tier route onto allowlisted `/users` desk. */
function deskPathForNavAllowlist(pathname: string): string {
  const current = normalizeDeskPath(pathname);
  if (/^\/users\/[^/]+\/tier$/.test(current)) return '/users';
  return current;
}

export function useAdminRouteGate(): AdminRouteGateView {
  const { session, loading, setAuthSession } = useAuth();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const { role } = useAdminOperatorRbac();
  const isAuthSurface = isAdminAuthSurfacePath(pathname);
  const [deskView, setDeskView] = useState<'loading' | 'forbidden' | 'ready'>('loading');

  useEffect(() => {
    if (loading) return;

    if (!session) {
      if (!isAuthSurface) {
        void navigate({ to: ADMIN_LOGIN_ROUTE });
      }
      return;
    }

    if (isAuthSurface) return;

    let cancelled = false;

    void (async () => {
      setDeskView('loading');
      const access = await resolveAdminDeskAccess(session.user.id);
      if (cancelled) return;

      if (access.kind === 'forbidden') {
        await signOutLocal();
        setAuthSession(null);
        setDeskView('forbidden');
        return;
      }

      const mfaRoute = adminDeskAccessRoute(access);
      if (mfaRoute) {
        void navigate({ to: mfaRoute });
        return;
      }

      const deskPath = deskPathForNavAllowlist(pathname);
      if (deskPath !== '/' && !isAdminNavRouteAllowed(role, deskPath)) {
        void navigate({ to: '/' });
        return;
      }

      setDeskView('ready');
    })();

    return () => {
      cancelled = true;
    };
  }, [session, loading, isAuthSurface, navigate, setAuthSession, pathname, role]);

  if (isAuthSurface) return { kind: 'auth-surface' };
  if (loading || (!session && !isAuthSurface)) return { kind: 'loading' };
  if (!session) return { kind: 'unauthenticated' };
  if (deskView === 'forbidden') return { kind: 'forbidden' };
  if (deskView === 'loading') return { kind: 'loading' };
  return { kind: 'ready' };
}
