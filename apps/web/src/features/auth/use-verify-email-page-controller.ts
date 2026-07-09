import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import { resolvePostAuthDestination } from '@/domain/onboarding-handoff-display-contract';
import { resendSignupVerification } from '@/lib/auth';
import { authErrorMessageKey, isValidEmail, type AuthFieldErrorCode } from '@/lib/auth-error-key';
import { isOnboardingComplete } from '@/lib/onboarding-funnel';
import { useT } from '@/product/i18n';

type ViewState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'sent' }
  | { kind: 'error'; code: AuthFieldErrorCode };

export type VerifyEmailPageControllerView = {
  t: (key: MessageKey) => string;
  loading: boolean;
  email: string;
  setEmail: (value: string) => void;
  sent: boolean;
  isBusy: boolean;
  resendSent: boolean;
  resendBusy: boolean;
  resendErrorKey: MessageKey | null;
  errorKey: MessageKey | null;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
};

type VerifyEmailPageControllerOptions = {
  initialEmail?: string;
  startSent?: boolean;
};

function resolveDestination(userId: string | undefined): string {
  return resolvePostAuthDestination({
    userId,
    isOnboardingComplete,
  });
}

/** Canonical `/verify-email` controller — resend signup confirmation (P3·W2). */
export function useVerifyEmailPageController(
  options: VerifyEmailPageControllerOptions = {},
): VerifyEmailPageControllerView {
  const t = useT();
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(() => options.initialEmail?.trim() ?? '');
  const [resendSent, setResendSent] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendErrorKey, setResendErrorKey] = useState<MessageKey | null>(null);
  const [state, setState] = useState<ViewState>(() =>
    options.startSent && options.initialEmail?.trim() ? { kind: 'sent' } : { kind: 'idle' },
  );

  useEffect(() => {
    const fromQuery = options.initialEmail?.trim();
    if (!fromQuery) return;
    setEmail(fromQuery);
    if (options.startSent) {
      setState({ kind: 'sent' });
    }
  }, [options.initialEmail, options.startSent]);

  useEffect(() => {
    if (!loading && session) {
      void navigate({ to: resolveDestination(session.user.id) });
    }
  }, [session, loading, navigate]);

  const isBusy = state.kind === 'submitting' || resendBusy;
  const sent = state.kind === 'sent';
  const errorKey = state.kind === 'error' ? authErrorMessageKey(state.code) : null;

  async function dispatchVerification(targetEmail: string): Promise<boolean> {
    const trimmed = targetEmail.trim();
    if (!trimmed) {
      setState({ kind: 'error', code: 'emailRequired' });
      return false;
    }
    if (!isValidEmail(trimmed)) {
      setState({ kind: 'error', code: 'emailInvalid' });
      return false;
    }

    setState({ kind: 'submitting' });
    const result = await resendSignupVerification(trimmed);
    if (!result.ok) {
      setState({ kind: 'error', code: result.code });
      return false;
    }
    setEmail(trimmed);
    setResendErrorKey(null);
    setResendSent(false);
    setState({ kind: 'sent' });
    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy) return;
    await dispatchVerification(email);
  }

  async function resendVerificationEmail() {
    if (!email.trim() || isBusy) return;
    setResendBusy(true);
    const result = await resendSignupVerification(email.trim());
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
    setEmail,
    sent,
    isBusy,
    resendSent,
    resendBusy,
    resendErrorKey,
    errorKey,
    handleSubmit,
    resendVerificationEmail,
  };
}
