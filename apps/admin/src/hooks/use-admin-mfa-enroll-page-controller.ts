import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import {
  challengeMfaFactor,
  enrollTotpFactor,
  loadAdminMfaGateState,
  verifyMfaFactor,
  waitForAdminAal2,
} from '@/domain/admin-auth';
import {
  ADMIN_LOGIN_ROUTE,
  ADMIN_MFA_CHALLENGE_ROUTE,
} from '@/domain/admin-security-display-contract';
import { fetchProfileIsAdmin } from '@/domain/admin-post-auth';
import { signOutLocal } from '@/lib/auth';
import { useT } from '@/product/i18n';

type EnrollPayload = {
  factorId: string;
  qrCode: string;
  secret: string;
};

type ViewState =
  | { kind: 'loading' }
  | { kind: 'forbidden' }
  | { kind: 'setup-error' }
  | { kind: 'ready'; enroll: EnrollPayload }
  | { kind: 'verifying'; enroll: EnrollPayload }
  | { kind: 'verify-error'; enroll: EnrollPayload };

export type AdminMfaEnrollPageControllerView = {
  t: (key: MessageKey) => string;
  loading: boolean;
  forbidden: boolean;
  setupError: boolean;
  enroll: EnrollPayload | null;
  code: string;
  setCode: (value: string) => void;
  isBusy: boolean;
  verifyError: boolean;
  handleVerifyEnroll: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

const TOTP_CODE_RE = /^\d{6}$/;

export function useAdminMfaEnrollPageController(): AdminMfaEnrollPageControllerView {
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

      const gate = await loadAdminMfaGateState();
      if (cancelled) return;
      if (gate.currentLevel === 'aal2') {
        void navigate({ to: '/' });
        return;
      }
      if (gate.hasVerifiedTotp) {
        const challengeRoute: string = ADMIN_MFA_CHALLENGE_ROUTE;
        void navigate({ to: challengeRoute });
        return;
      }

      try {
        const enroll = await enrollTotpFactor();
        if (cancelled) return;
        setState({ kind: 'ready', enroll });
      } catch {
        if (cancelled) return;
        setState({ kind: 'setup-error' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session, loading, navigate, setAuthSession]);

  const enroll =
    state.kind === 'ready' || state.kind === 'verifying' || state.kind === 'verify-error'
      ? state.enroll
      : null;
  const isBusy = state.kind === 'verifying';
  const verifyError = state.kind === 'verify-error';

  async function handleVerifyEnroll(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy || !enroll) return;

    const trimmed = code.trim();
    if (!TOTP_CODE_RE.test(trimmed)) {
      setState({ kind: 'verify-error', enroll });
      return;
    }

    setState({ kind: 'verifying', enroll });
    try {
      const { challengeId } = await challengeMfaFactor(enroll.factorId);
      await verifyMfaFactor({
        factorId: enroll.factorId,
        challengeId,
        code: trimmed,
      });
      await waitForAdminAal2();
      void navigate({ to: '/' });
    } catch {
      setState({ kind: 'verify-error', enroll });
    }
  }

  return {
    t,
    loading: loading || state.kind === 'loading',
    forbidden: state.kind === 'forbidden',
    setupError: state.kind === 'setup-error',
    enroll,
    code,
    setCode,
    isBusy,
    verifyError,
    handleVerifyEnroll,
  };
}
