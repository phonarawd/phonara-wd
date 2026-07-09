import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import {
  challengeMfaFactor,
  loadAdminMfaGateState,
  verifyMfaFactor,
  waitForAdminAal2,
} from '@/domain/admin-auth';
import {
  ADMIN_LOGIN_ROUTE,
  ADMIN_MFA_ENROLL_ROUTE,
} from '@/domain/admin-security-display-contract';
import { fetchProfileIsAdmin } from '@/domain/admin-post-auth';
import { signOutLocal } from '@/lib/auth';
import { useT } from '@/product/i18n';

type ViewState =
  | { kind: 'loading' }
  | { kind: 'forbidden' }
  | { kind: 'setup-error' }
  | { kind: 'missing-factor' }
  | { kind: 'ready'; factorId: string }
  | { kind: 'verifying'; factorId: string }
  | { kind: 'verify-error'; factorId: string };

export type AdminMfaChallengePageControllerView = {
  t: (key: MessageKey) => string;
  loading: boolean;
  forbidden: boolean;
  setupError: boolean;
  missingFactor: boolean;
  code: string;
  setCode: (value: string) => void;
  isBusy: boolean;
  verifyError: boolean;
  handleVerifyChallenge: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

const TOTP_CODE_RE = /^\d{6}$/;

export function useAdminMfaChallengePageController(): AdminMfaChallengePageControllerView {
  const t = useT();
  const { session, loading, setAuthSession } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [state, setState] = useState<ViewState>({ kind: 'loading' });

  useEffect(() => {
    if (loading) return;

    if (!session) {
      void navigate({ to: ADMIN_LOGIN_ROUTE });
      return;
    }

    let cancelled = false;

    void (async () => {
      const isAdmin = await fetchProfileIsAdmin(session.user.id);
      if (cancelled) return;
      if (!isAdmin) {
        await signOutLocal();
        setAuthSession(null);
        setState({ kind: 'forbidden' });
        return;
      }

      try {
        const gate = await loadAdminMfaGateState();
        if (cancelled) return;
        if (gate.currentLevel === 'aal2') {
          void navigate({ to: '/' });
          return;
        }
        if (!gate.hasVerifiedTotp) {
          void navigate({ to: ADMIN_MFA_ENROLL_ROUTE });
          return;
        }
        if (!gate.verifiedTotpFactorId) {
          setState({ kind: 'missing-factor' });
          return;
        }
        setState({ kind: 'ready', factorId: gate.verifiedTotpFactorId });
      } catch {
        if (cancelled) return;
        setState({ kind: 'setup-error' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session, loading, navigate, setAuthSession]);

  const factorId =
    state.kind === 'ready' || state.kind === 'verifying' || state.kind === 'verify-error'
      ? state.factorId
      : null;
  const isBusy = state.kind === 'verifying';
  const verifyError = state.kind === 'verify-error';

  async function handleVerifyChallenge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy || !factorId) return;

    const trimmed = code.trim();
    if (!TOTP_CODE_RE.test(trimmed)) {
      setState({ kind: 'verify-error', factorId });
      return;
    }

    setState({ kind: 'verifying', factorId });
    try {
      const { challengeId } = await challengeMfaFactor(factorId);
      await verifyMfaFactor({
        factorId,
        challengeId,
        code: trimmed,
      });
      await waitForAdminAal2();
      void navigate({ to: '/' });
    } catch {
      setState({ kind: 'verify-error', factorId });
    }
  }

  return {
    t,
    loading: loading || state.kind === 'loading',
    forbidden: state.kind === 'forbidden',
    setupError: state.kind === 'setup-error',
    missingFactor: state.kind === 'missing-factor',
    code,
    setCode,
    isBusy,
    verifyError,
    handleVerifyChallenge,
  };
}
