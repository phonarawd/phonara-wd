import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import { resolvePostAuthDestination } from '@/domain/onboarding-handoff-display-contract';
import { markHasAccount } from '@/lib/auth-account-marker';
import { signInWithPassword, sendMagicLink, signInWithPasskey } from '@/lib/auth';
import { authErrorMessageKey, isValidEmail, type AuthFieldErrorCode } from '@/lib/auth-error-key';
import { isOnboardingComplete } from '@/lib/onboarding-funnel';
import { markAuthLoginForPwaInstall } from '@/lib/pwa-auth-nudge';
import { useT } from '@/product/i18n';

type ViewState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'magicSending' }
  | { kind: 'magicSent' }
  | { kind: 'error'; code: AuthFieldErrorCode };

export type LoginPageControllerView = {
  t: (key: MessageKey) => string;
  loading: boolean;
  email: string;
  password: string;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  isBusy: boolean;
  errorKey: MessageKey | null;
  magicSent: boolean;
  handlePasswordLogin: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleMagicLink: () => Promise<void>;
  handlePasskeyLogin: () => Promise<void>;
};

type LoginPageControllerOptions = {
  /** When false, caller closes UI after session is set (e.g. modal). */
  redirectOnSuccess?: boolean;
  redirectTo?: '/home';
};

function resolveDestination(userId: string | undefined, redirectTo: '/home'): string {
  return resolvePostAuthDestination({
    userId,
    isOnboardingComplete,
    defaultCompleteRoute: redirectTo,
  });
}

export function useLoginPageController(
  options: LoginPageControllerOptions = {},
): LoginPageControllerView {
  const { redirectOnSuccess = true, redirectTo = '/home' } = options;
  const t = useT();
  const { session, loading, setAuthSession } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [state, setState] = useState<ViewState>({ kind: 'idle' });

  useEffect(() => {
    if (!loading && session && redirectOnSuccess) {
      void navigate({ to: resolveDestination(session.user.id, redirectTo) });
    }
  }, [session, loading, navigate, redirectOnSuccess, redirectTo]);

  const isBusy = state.kind === 'submitting' || state.kind === 'magicSending';
  const errorKey = state.kind === 'error' ? authErrorMessageKey(state.code) : null;
  const magicSent = state.kind === 'magicSent';

  async function completeSession(userId: string | undefined): Promise<void> {
    markHasAccount();
    markAuthLoginForPwaInstall();
    if (redirectOnSuccess) {
      void navigate({ to: resolveDestination(userId, redirectTo) });
    }
  }

  async function handlePasswordLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy) return;
    const trimmed = email.trim();
    if (!trimmed) return setState({ kind: 'error', code: 'emailRequired' });
    if (!isValidEmail(trimmed)) return setState({ kind: 'error', code: 'emailInvalid' });
    if (!password) return setState({ kind: 'error', code: 'passwordRequired' });

    setState({ kind: 'submitting' });
    const result = await signInWithPassword(trimmed, password);
    if (result.ok) {
      if (!result.session) {
        setState({ kind: 'error', code: 'generic' });
        return;
      }
      setAuthSession(result.session);
      await completeSession(result.session.user.id);
      return;
    }
    setState({ kind: 'error', code: result.code });
  }

  async function handleMagicLink() {
    if (isBusy) return;
    const trimmed = email.trim();
    if (!trimmed) return setState({ kind: 'error', code: 'emailRequired' });
    if (!isValidEmail(trimmed)) return setState({ kind: 'error', code: 'emailInvalid' });

    setState({ kind: 'magicSending' });
    const { error } = await sendMagicLink(trimmed);
    if (error) {
      setState({ kind: 'error', code: 'generic' });
      return;
    }
    setState({ kind: 'magicSent' });
  }

  async function handlePasskeyLogin() {
    if (isBusy) return;
    setState({ kind: 'submitting' });
    const result = await signInWithPasskey();
    if (result.ok) {
      if (!result.session) {
        setState({ kind: 'error', code: 'generic' });
        return;
      }
      setAuthSession(result.session);
      await completeSession(result.session.user.id);
      return;
    }
    setState({ kind: 'error', code: result.code });
  }

  return {
    t,
    loading,
    email,
    password,
    setEmail,
    setPassword,
    isBusy,
    errorKey,
    magicSent,
    handlePasswordLogin,
    handleMagicLink,
    handlePasskeyLogin,
  };
}
