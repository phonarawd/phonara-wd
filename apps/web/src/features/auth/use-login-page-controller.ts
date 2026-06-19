import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '../../contexts/auth-context';
import { signInWithPassword, sendMagicLink } from '../../lib/auth';
import {
  authErrorMessageKey,
  isValidEmail,
  type AuthFieldErrorCode,
} from '../../lib/auth-error-key';
import { useT } from '../../lib/i18n';

type ViewState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'magicSending' }
  | { kind: 'magicSent' }
  | { kind: 'error'; code: AuthFieldErrorCode };

type LoginPageControllerOptions = {
  /** When false, caller closes UI after session is set (e.g. TopBar modal). */
  redirectOnSuccess?: boolean;
  redirectTo?: '/dashboard' | '/home';
};

export function useLoginPageController(options: LoginPageControllerOptions = {}) {
  const { redirectOnSuccess = true, redirectTo = '/home' } = options;
  const t = useT();
  const { session, loading, setAuthSession } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [state, setState] = useState<ViewState>({ kind: 'idle' });

  useEffect(() => {
    if (!loading && session && redirectOnSuccess) void navigate({ to: redirectTo });
  }, [session, loading, navigate, redirectOnSuccess, redirectTo]);

  const isBusy = state.kind === 'submitting' || state.kind === 'magicSending';
  const errorKey = state.kind === 'error' ? authErrorMessageKey(state.code) : null;
  const magicSent = state.kind === 'magicSent';

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
      if (redirectOnSuccess) void navigate({ to: redirectTo });
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
  };
}
