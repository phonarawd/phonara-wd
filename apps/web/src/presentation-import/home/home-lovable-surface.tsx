import { useEffect, useState } from 'react';
import { PresentationRoot } from '../presentation-root';
import { ImportedHomePage } from '../pages/home-page';
import { WelcomeSheet } from '@/components/welcome/WelcomeSheet';
import { useAuth } from '../../contexts/auth-context';
import { useWallet } from '../../hooks/use-wallet';
import { ensureOnboardingConsents } from '../../lib/onboarding-consent';

/**
 * L1-16 — /home Hub (Lovable stake-lobby). Guests see FOMO static props;
 * authed users get wallet wire + welcome onboarding.
 */
export function HomeLovableSurface() {
  const { session, loading: authLoading } = useAuth();
  const { wallet, loading: walletLoading } = useWallet();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (!session?.user.id) return;
    void ensureOnboardingConsents().catch(() => undefined);
  }, [session?.user.id]);

  useEffect(() => {
    if (!session || walletLoading || !wallet) return;
    const isNew =
      wallet.phon_available === '0.000000' &&
      wallet.usdt_available === '0.000000' &&
      wallet.krw_available === '0';
    if (isNew) setShowWelcome(true);
  }, [session, wallet, walletLoading]);

  if (authLoading) {
    return (
      <PresentationRoot>
        <div className="flex min-h-dvh items-center justify-center" aria-busy="true" data-testid="home-loading">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      </PresentationRoot>
    );
  }

  return (
    <PresentationRoot>
      {session && showWelcome ? (
        <WelcomeSheet open={showWelcome} onDismiss={() => setShowWelcome(false)} />
      ) : null}
      <ImportedHomePage />
    </PresentationRoot>
  );
}
