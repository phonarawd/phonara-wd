import { createRootRoute, Outlet, Navigate, useRouterState } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/auth-context';
import { useIsAdmin } from '../hooks/use-is-admin';
import { useT } from '../lib/i18n';
import { signOut } from '../lib/auth';
import { loadAdminMfaGateState, type AdminMfaGateState } from '../domain/admin-auth';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const { session, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [mfaState, setMfaState] = useState<AdminMfaGateState | null>(null);
  const [mfaLoading, setMfaLoading] = useState(false);
  const t = useT();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const isLogin = pathname === '/login';
  const isMfaEnroll = pathname === '/mfa/enroll';
  const isMfaChallenge = pathname === '/mfa/challenge';
  const isMfaRoute = isMfaEnroll || isMfaChallenge;

  useEffect(() => {
    if (!session) {
      setMfaState(null);
      setMfaLoading(false);
      return;
    }
    setMfaLoading(true);
    void loadAdminMfaGateState()
      .then((state) => {
        setMfaState(state);
        setMfaLoading(false);
      })
      .catch(() => {
        setMfaState(null);
        setMfaLoading(false);
      });
  }, [session]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-dvh text-muted text-sm">
        {t('common.loading')}
      </div>
    );
  }

  if (!session) {
    if (isLogin) return <Outlet />;
    return <Navigate to="/login" />;
  }

  if (!isLogin && !isMfaRoute) {
    if (adminLoading) {
      return (
        <div className="flex items-center justify-center min-h-dvh text-muted text-sm">
          {t('admin.loading')}
        </div>
      );
    }

    if (!isAdmin) {
      return (
        <div
          className="flex flex-col items-center justify-center min-h-dvh gap-4"
          data-testid="admin-forbidden"
        >
          <p className="text-down font-semibold">{t('admin.forbidden')}</p>
          <button
            className="text-sm text-muted underline"
            onClick={() => { void signOut(); }}
          >
            {t('nav.logout')}
          </button>
        </div>
      );
    }

    if (mfaLoading || !mfaState) {
      return (
        <div className="flex items-center justify-center min-h-dvh text-muted text-sm">
          {t('common.loading')}
        </div>
      );
    }

    if (!mfaState.hasVerifiedTotp) {
      return <Navigate to="/mfa/enroll" />;
    }

    if (mfaState.currentLevel !== 'aal2') {
      return <Navigate to="/mfa/challenge" />;
    }
  }

  if (isMfaRoute) {
    if (adminLoading) {
      return (
        <div className="flex items-center justify-center min-h-dvh text-muted text-sm">
          {t('admin.loading')}
        </div>
      );
    }

    if (!isAdmin) {
      return (
        <div
          className="flex flex-col items-center justify-center min-h-dvh gap-4"
          data-testid="admin-forbidden"
        >
          <p className="text-down font-semibold">{t('admin.forbidden')}</p>
          <button
            className="text-sm text-muted underline"
            onClick={() => { void signOut(); }}
          >
            {t('nav.logout')}
          </button>
        </div>
      );
    }

    if (mfaLoading || !mfaState) {
      return (
        <div className="flex items-center justify-center min-h-dvh text-muted text-sm">
          {t('common.loading')}
        </div>
      );
    }

    if (isMfaEnroll && mfaState.hasVerifiedTotp && mfaState.currentLevel === 'aal2') {
      return <Navigate to="/overview" />;
    }

    if (isMfaEnroll && mfaState.hasVerifiedTotp && mfaState.currentLevel !== 'aal2') {
      return <Navigate to="/mfa/challenge" />;
    }

    if (isMfaChallenge && !mfaState.hasVerifiedTotp) {
      return <Navigate to="/mfa/enroll" />;
    }

    if (isMfaChallenge && mfaState.currentLevel === 'aal2') {
      return <Navigate to="/overview" />;
    }
  }

  return <Outlet />;
}
