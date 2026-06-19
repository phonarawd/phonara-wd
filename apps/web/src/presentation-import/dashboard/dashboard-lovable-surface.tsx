import { PresentationRoot } from '../presentation-root';
import { ImportedDashboardPage } from '../pages/dashboard-page';
import { useDashboardPageController } from '../../features/dashboard/use-dashboard-page-controller';
import { WelcomeSheet } from '@/components/welcome/WelcomeSheet';
import { useMobileViewport } from '@/hooks/use-mobile-viewport';
import { Navigate } from '@tanstack/react-router';

/**
 * L2 Wave B — /dashboard route body (desktop engine surface).
 * Mobile authed users land on L1-16 /home hub instead.
 */
export function DashboardLovableSurface() {
  const isMobile = useMobileViewport();
  const {
    authLoading,
    walletLoading,
    showWelcome,
    dismissWelcome,
    viewProps,
    claimDaily,
    dailyLoading,
    spin,
    rouletteLoading,
  } = useDashboardPageController();

  if (isMobile) {
    return <Navigate to="/home" replace />;
  }

  if (authLoading || walletLoading) {
    return (
      <PresentationRoot>
        <div className="flex min-h-dvh items-center justify-center" aria-busy="true" data-testid="dashboard-loading">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      </PresentationRoot>
    );
  }

  return (
    <PresentationRoot>
      {showWelcome ? <WelcomeSheet open={showWelcome} onDismiss={dismissWelcome} /> : null}
      <ImportedDashboardPage
        {...viewProps}
        onClaimDaily={() => void claimDaily()}
        onSpinRoulette={() => void spin()}
        dailyClaimBusy={dailyLoading}
        rouletteSpinBusy={rouletteLoading}
      />
    </PresentationRoot>
  );
}
