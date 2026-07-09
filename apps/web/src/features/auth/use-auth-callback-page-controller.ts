import { useEffect, useState } from 'react';

import { useNavigate } from '@tanstack/react-router';

import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';

import { resolvePostAuthDestination } from '@/domain/onboarding-handoff-display-contract';

import { markHasAccount } from '@/lib/auth-account-marker';
import { finalizeAdsSignupAttribution } from '@/lib/ads-attribution';
import { ensureOnboardingConsents } from '@/lib/onboarding-consent';

import { isOnboardingComplete } from '@/lib/onboarding-funnel';

import { markAuthLoginForPwaInstall } from '@/lib/pwa-auth-nudge';

import { clearPendingReferralCode, getPendingReferralCode } from '@/lib/referral-pending';

import { registerReferralCode } from '@/lib/referral-register';

import { supabase } from '@/lib/supabase';

import { useT } from '@/product/i18n';

type ViewState = 'processing' | 'failed';

export type AuthCallbackPageControllerView = {
  t: (key: MessageKey) => string;

  state: ViewState;
};

function isRecoveryHandoff(): boolean {
  if (typeof window === 'undefined') return false;

  if (window.location.hash.includes('type=recovery')) return true;

  const next = new URLSearchParams(window.location.search).get('next');

  return next === '/reset-password';
}

function handoffToResetPassword(): void {
  const { search, hash } = window.location;

  window.location.replace(`/reset-password${search}${hash}`);
}

async function wirePendingReferral(): Promise<void> {
  const code = getPendingReferralCode();

  if (!code) return;

  try {
    await registerReferralCode(code);
  } catch {
    // silent wire — invalid/duplicate codes must not block auth callback
  } finally {
    clearPendingReferralCode();
  }
}

/** Canonical `/auth/callback` controller — OAuth/magic-link PKCE + onboarding handoff (P3·W2). */

export function useAuthCallbackPageController(): AuthCallbackPageControllerView {
  const t = useT();

  const navigate = useNavigate();

  const { setAuthSession } = useAuth();

  const [state, setState] = useState<ViewState>('processing');

  useEffect(() => {
    let cancelled = false;

    async function finishAuth() {
      const params = new URLSearchParams(window.location.search);

      const nextParam = params.get('next');

      const code = params.get('code');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (cancelled) return;

        if (error && !isRecoveryHandoff()) {
          setState('failed');

          return;
        }
      }

      if (isRecoveryHandoff()) {
        handoffToResetPassword();

        return;
      }

      const { data, error } = await supabase.auth.getSession();

      if (cancelled) return;

      if (error || !data.session) {
        setState('failed');

        return;
      }

      setAuthSession(data.session);

      markHasAccount();

      markAuthLoginForPwaInstall();

      await wirePendingReferral();

      try {
        await ensureOnboardingConsents();
      } catch {
        // onboarding mount retries; callback must not block redirect
      }

      await finalizeAdsSignupAttribution({ requirePendingSignup: true });

      const destination = resolvePostAuthDestination({
        userId: data.session.user.id,

        isOnboardingComplete,

        explicitNext: nextParam,
      });

      void navigate({ to: destination });
    }

    void finishAuth();

    return () => {
      cancelled = true;
    };
  }, [navigate, setAuthSession]);

  return { t, state };
}
