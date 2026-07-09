import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import { fetchProfileIsAdmin, resolveAdminPostLoginDestination } from '@/domain/admin-post-auth';
import { signInWithPassword, signOutLocal } from '@/lib/auth';
import { authErrorMessageKey, isValidEmail, type AuthFieldErrorCode } from '@/lib/auth-error-key';
import { useT } from '@/product/i18n';

type ViewState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'error'; code: AuthFieldErrorCode }
  | { kind: 'forbidden' };

export type AdminLoginPageControllerView = {
  t: (key: MessageKey) => string;
  loading: boolean;
  email: string;
  password: string;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  isBusy: boolean;
  errorKey: MessageKey | null;
  forbidden: boolean;
  handlePasswordLogin: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

export function useAdminLoginPageController(): AdminLoginPageControllerView {
  const t = useT();
  const { session, loading, setAuthSession } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [state, setState] = useState<ViewState>({ kind: 'idle' });

  useEffect(() => {
    if (loading || !session) return;

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
      const destination = await resolveAdminPostLoginDestination();
      if (cancelled) return;
      void navigate({ to: destination });
    })();

    return () => {
      cancelled = true;
    };
  }, [session, loading, navigate, setAuthSession]);

  const isBusy = state.kind === 'submitting';
  const errorKey = state.kind === 'error' ? authErrorMessageKey(state.code) : null;
  const forbidden = state.kind === 'forbidden';

  async function handlePasswordLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy) return;

    const trimmed = email.trim();
    if (!trimmed) return setState({ kind: 'error', code: 'emailRequired' });
    if (!isValidEmail(trimmed)) return setState({ kind: 'error', code: 'emailInvalid' });
    if (!password) return setState({ kind: 'error', code: 'passwordRequired' });

    setState({ kind: 'submitting' });
    const result = await signInWithPassword(trimmed, password);
    if (!result.ok) {
      setState({ kind: 'error', code: result.code });
      return;
    }

    const isAdmin = await fetchProfileIsAdmin(result.session.user.id);
    if (!isAdmin) {
      await signOutLocal();
      setAuthSession(null);
      setState({ kind: 'forbidden' });
      return;
    }

    setAuthSession(result.session);
    const destination = await resolveAdminPostLoginDestination();
    void navigate({ to: destination });
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
    forbidden,
    handlePasswordLogin,
  };
}
