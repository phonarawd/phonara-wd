import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import {
  challengeMfaFactor,
  enrollTotpFactor,
  listPasskeys,
  loadUserSecurityState,
  unenrollTotpFactor,
  verifyMfaFactor,
  deletePasskey,
  registerPasskey,
  type UserSecurityState,
} from '@/domain/user-auth-security';
import { useT } from '@/product/i18n';
import { productToast } from '@/product/primitives/toast-zone';

export type PasskeyRow = { id: string; friendly_name: string | null };

export type TotpEnrollPayload = {
  factorId: string;
  qrCode: string;
  secret: string;
};

export type SettingsSecurityControllerView = {
  t: (key: MessageKey) => string;
  loading: boolean;
  errorKey: MessageKey | null;
  security: UserSecurityState | null;
  passkeys: PasskeyRow[];
  totpEnroll: TotpEnrollPayload | null;
  totpCode: string;
  setTotpCode: (value: string) => void;
  totpEnrolling: boolean;
  totpVerifyError: boolean;
  passkeyBusy: boolean;
  totpRemoveBusy: boolean;
  refresh: () => Promise<void>;
  handleRegisterPasskey: () => Promise<void>;
  handleDeletePasskey: (passkeyId: string) => Promise<void>;
  handleStartTotpEnroll: () => Promise<void>;
  handleVerifyTotpEnroll: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleCancelTotpEnroll: () => void;
  handleRemoveTotp: () => Promise<void>;
};

const TOTP_CODE_RE = /^\d{6}$/;

async function loadPageData(): Promise<{
  security: UserSecurityState;
  passkeys: PasskeyRow[];
}> {
  const [security, passkeys] = await Promise.all([loadUserSecurityState(), listPasskeys()]);
  return { security, passkeys };
}

/** Canonical `/settings/security` — passkey + TOTP management (P5). */
export function useSettingsSecurityController(): SettingsSecurityControllerView {
  const t = useT();
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);
  const [security, setSecurity] = useState<UserSecurityState | null>(null);
  const [passkeys, setPasskeys] = useState<PasskeyRow[]>([]);
  const [totpEnroll, setTotpEnroll] = useState<TotpEnrollPayload | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [totpEnrolling, setTotpEnrolling] = useState(false);
  const [totpVerifyError, setTotpVerifyError] = useState(false);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [totpRemoveBusy, setTotpRemoveBusy] = useState(false);

  const refresh = useCallback(async () => {
    setErrorKey(null);
    try {
      const data = await loadPageData();
      setSecurity(data.security);
      setPasskeys(data.passkeys);
    } catch {
      setErrorKey('common.error.generic');
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      void navigate({ to: '/login', replace: true });
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const data = await loadPageData();
        if (cancelled) return;
        setSecurity(data.security);
        setPasskeys(data.passkeys);
        setErrorKey(null);
      } catch {
        if (cancelled) return;
        setErrorKey('common.error.generic');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session, authLoading, navigate]);

  async function handleRegisterPasskey() {
    if (passkeyBusy) return;
    setPasskeyBusy(true);
    try {
      await registerPasskey();
      await refresh();
      productToast.show({ zone: 'strict', key: 'security.passkey.registerOk' });
    } catch {
      productToast.show({ zone: 'strict', key: 'security.passkey.registerError' });
    } finally {
      setPasskeyBusy(false);
    }
  }

  async function handleDeletePasskey(passkeyId: string) {
    if (passkeyBusy) return;
    setPasskeyBusy(true);
    try {
      await deletePasskey(passkeyId);
      await refresh();
      productToast.show({ zone: 'strict', key: 'security.passkey.deleteOk' });
    } catch {
      productToast.show({ zone: 'strict', key: 'security.passkey.deleteError' });
    } finally {
      setPasskeyBusy(false);
    }
  }

  async function handleStartTotpEnroll() {
    if (totpEnrolling || security?.hasVerifiedTotp) return;
    setTotpVerifyError(false);
    setTotpCode('');
    setTotpEnrolling(true);
    try {
      const enroll = await enrollTotpFactor();
      setTotpEnroll(enroll);
    } catch {
      productToast.show({ zone: 'strict', key: 'security.totp.enrollError' });
      setTotpEnroll(null);
    } finally {
      setTotpEnrolling(false);
    }
  }

  function handleCancelTotpEnroll() {
    setTotpEnroll(null);
    setTotpCode('');
    setTotpVerifyError(false);
  }

  async function handleVerifyTotpEnroll(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!totpEnroll || totpEnrolling) return;

    const trimmed = totpCode.trim();
    if (!TOTP_CODE_RE.test(trimmed)) {
      setTotpVerifyError(true);
      return;
    }

    setTotpEnrolling(true);
    setTotpVerifyError(false);
    try {
      const { challengeId } = await challengeMfaFactor(totpEnroll.factorId);
      await verifyMfaFactor({
        factorId: totpEnroll.factorId,
        challengeId,
        code: trimmed,
      });
      setTotpEnroll(null);
      setTotpCode('');
      await refresh();
      productToast.show({ zone: 'strict', key: 'security.totp.enrollOk' });
    } catch {
      setTotpVerifyError(true);
    } finally {
      setTotpEnrolling(false);
    }
  }

  async function handleRemoveTotp() {
    if (totpRemoveBusy || !security?.verifiedTotpFactorId) return;
    setTotpRemoveBusy(true);
    try {
      await unenrollTotpFactor(security.verifiedTotpFactorId);
      await refresh();
      productToast.show({ zone: 'strict', key: 'security.totp.removeOk' });
    } catch {
      productToast.show({ zone: 'strict', key: 'security.totp.removeError' });
    } finally {
      setTotpRemoveBusy(false);
    }
  }

  return {
    t,
    loading: authLoading || loading,
    errorKey,
    security,
    passkeys,
    totpEnroll,
    totpCode,
    setTotpCode,
    totpEnrolling,
    totpVerifyError,
    passkeyBusy,
    totpRemoveBusy,
    refresh,
    handleRegisterPasskey,
    handleDeletePasskey,
    handleStartTotpEnroll,
    handleVerifyTotpEnroll,
    handleCancelTotpEnroll,
    handleRemoveTotp,
  };
}
