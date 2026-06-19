import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '../../contexts/auth-context';
import { signUpWithPassword } from '../../lib/auth';
import {
  authErrorMessageKey,
  isValidEmail,
  type AuthFieldErrorCode,
} from '../../lib/auth-error-key';
import { ensureOnboardingConsents } from '../../lib/onboarding-consent';
import { useT } from '../../lib/i18n';

const MIN_PASSWORD_LENGTH = 8;

type ViewState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'verifySent' }
  | { kind: 'error'; code: AuthFieldErrorCode };

export function useSignupPageController() {
  const t = useT();
  const { session, loading, setAuthSession } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [state, setState] = useState<ViewState>({ kind: 'idle' });

  useEffect(() => {
    if (!loading && session) void navigate({ to: '/home' });
  }, [session, loading, navigate]);

  const isBusy = state.kind === 'submitting';
  const verifySent = state.kind === 'verifySent';
  const errorKey = state.kind === 'error' ? authErrorMessageKey(state.code) : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy) return;
    const trimmed = email.trim();
    if (!trimmed) return setState({ kind: 'error', code: 'emailRequired' });
    if (!isValidEmail(trimmed)) return setState({ kind: 'error', code: 'emailInvalid' });
    if (!password) return setState({ kind: 'error', code: 'passwordRequired' });
    if (password.length < MIN_PASSWORD_LENGTH) {
      return setState({ kind: 'error', code: 'passwordTooShort' });
    }
    if (password !== confirm) {
      return setState({ kind: 'error', code: 'passwordMismatch' });
    }

    setState({ kind: 'submitting' });
    const result = await signUpWithPassword(trimmed, password);
    if (!result.ok) {
      setState({ kind: 'error', code: result.code });
      return;
    }
    if (result.status === 'verify_email') {
      setState({ kind: 'verifySent' });
      return;
    }
    if (!result.session) {
      setState({ kind: 'error', code: 'generic' });
      return;
    }
    setAuthSession(result.session);
    try {
      await ensureOnboardingConsents();
    } catch {
      // Dashboard mount retries; signup terms notice covers implied acceptance.
    }
      void navigate({ to: '/home' });
  }

  return {
    t,
    loading,
    email,
    password,
    confirm,
    setEmail,
    setPassword,
    setConfirm,
    isBusy,
    verifySent,
    errorKey,
    handleSubmit,
  };
}
