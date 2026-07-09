import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import { resolvePostAuthDestination } from '@/domain/onboarding-handoff-display-contract';
import { markHasAccount } from '@/lib/auth-account-marker';
import { resendSignupVerification, signUpWithPassword } from '@/lib/auth';
import {
  authErrorMessageKey,
  getSignupEmailIssue,
  getSignupPasswordIssue,
  isValidEmail,
  type AuthFieldErrorCode,
} from '@/lib/auth-error-key';
import { finalizeAdsSignupAttribution, markPendingSignupConversion } from '@/lib/ads-attribution';
import { ensureOnboardingConsents } from '@/lib/onboarding-consent';
import { isOnboardingComplete } from '@/lib/onboarding-funnel';
import {
  clearPendingReferralCode,
  getPendingReferralCode,
  setPendingReferralCode,
} from '@/lib/referral-pending';
import { registerReferralCode } from '@/lib/referral-register';
import { useT } from '@/product/i18n';

type ViewState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'verifySent' }
  | { kind: 'error'; code: AuthFieldErrorCode };

export type SignupPageControllerView = {
  t: (key: MessageKey) => string;
  loading: boolean;
  email: string;
  password: string;
  confirm: string;
  referralCode: string;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setConfirm: (value: string) => void;
  setReferralCode: (value: string) => void;
  isBusy: boolean;
  verifySent: boolean;
  pendingEmail: string;
  resendSent: boolean;
  resendBusy: boolean;
  resendErrorKey: MessageKey | null;
  resendVerificationEmail: () => Promise<void>;
  errorKey: MessageKey | null;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

type SignupPageControllerOptions = {
  initialReferralCode?: string;
};

function resolveDestination(userId: string | undefined): string {
  return resolvePostAuthDestination({
    userId,
    isOnboardingComplete,
  });
}

async function wirePendingReferral(): Promise<void> {
  const code = getPendingReferralCode();
  if (!code) return;
  try {
    await registerReferralCode(code);
  } catch {
    // silent wire — invalid/duplicate codes must not block signup funnel
  } finally {
    clearPendingReferralCode();
  }
}

export function useSignupPageController(
  options: SignupPageControllerOptions = {},
): SignupPageControllerView {
  const t = useT();
  const { session, loading, setAuthSession } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [referralCode, setReferralCode] = useState(() => options.initialReferralCode?.trim() ?? '');
  const [pendingEmail, setPendingEmail] = useState('');
  const [resendSent, setResendSent] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendErrorKey, setResendErrorKey] = useState<MessageKey | null>(null);
  const [state, setState] = useState<ViewState>({ kind: 'idle' });

  useEffect(() => {
    const fromQuery = options.initialReferralCode?.trim();
    if (!fromQuery) return;
    setReferralCode(fromQuery);
    setPendingReferralCode(fromQuery);
  }, [options.initialReferralCode]);

  useEffect(() => {
    if (!loading && session) {
      void navigate({ to: resolveDestination(session.user.id) });
    }
  }, [session, loading, navigate]);

  const isBusy = state.kind === 'submitting';
  const verifySent = state.kind === 'verifySent';
  const errorKey = state.kind === 'error' ? authErrorMessageKey(state.code) : null;

  async function completeSignup(userId: string | undefined): Promise<void> {
    markHasAccount();
    await wirePendingReferral();
    try {
      await ensureOnboardingConsents();
    } catch {
      // onboarding mount retries; signup terms notice covers implied acceptance
    }
    await finalizeAdsSignupAttribution();
    void navigate({ to: resolveDestination(userId) });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy) return;

    const trimmed = email.trim();
    if (!trimmed) return setState({ kind: 'error', code: 'emailRequired' });
    if (!isValidEmail(trimmed)) return setState({ kind: 'error', code: 'emailInvalid' });
    if (getSignupEmailIssue(trimmed, isValidEmail) === 'blocked') {
      return setState({ kind: 'error', code: 'emailBlocked' });
    }
    if (!password) return setState({ kind: 'error', code: 'passwordRequired' });
    const passwordIssue = getSignupPasswordIssue(password);
    if (passwordIssue === 'tooShort') {
      return setState({ kind: 'error', code: 'passwordTooShort' });
    }
    if (passwordIssue === 'weak') {
      return setState({ kind: 'error', code: 'passwordWeak' });
    }
    if (password !== confirm) {
      return setState({ kind: 'error', code: 'passwordMismatch' });
    }

    if (referralCode.trim()) {
      setPendingReferralCode(referralCode);
    }

    setState({ kind: 'submitting' });
    const result = await signUpWithPassword(trimmed, password);
    if (!result.ok) {
      setState({ kind: 'error', code: result.code });
      return;
    }
    markPendingSignupConversion();
    if (result.status === 'verify_email') {
      setPendingEmail(trimmed);
      setResendSent(false);
      setResendErrorKey(null);
      setState({ kind: 'verifySent' });
      return;
    }
    if (!result.session) {
      setState({ kind: 'error', code: 'generic' });
      return;
    }
    setAuthSession(result.session);
    await completeSignup(result.session.user.id);
  }

  async function resendVerificationEmail() {
    if (!pendingEmail || resendBusy || isBusy) return;
    setResendBusy(true);
    const result = await resendSignupVerification(pendingEmail);
    setResendBusy(false);
    if (!result.ok) {
      setResendErrorKey(authErrorMessageKey(result.code));
      return;
    }
    setResendErrorKey(null);
    setResendSent(true);
  }

  return {
    t,
    loading,
    email,
    password,
    confirm,
    referralCode,
    setEmail,
    setPassword,
    setConfirm,
    setReferralCode,
    isBusy,
    verifySent,
    pendingEmail,
    resendSent,
    resendBusy,
    resendErrorKey,
    resendVerificationEmail,
    errorKey,
    handleSubmit,
  };
}
