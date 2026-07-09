import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import { resolvePostAuthDestination } from '@/domain/onboarding-handoff-display-contract';
import { sendPasswordReset, updatePassword } from '@/lib/auth';
import {
  authErrorMessageKey,
  getSignupPasswordIssue,
  isValidEmail,
  type AuthFieldErrorCode,
} from '@/lib/auth-error-key';
import { isOnboardingComplete } from '@/lib/onboarding-funnel';
import { supabase } from '@/lib/supabase';
import { useT } from '@/product/i18n';

type ViewState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'sent' }
  | { kind: 'completed' }
  | { kind: 'error'; code: AuthFieldErrorCode };

export type ResetPasswordPageControllerView = {
  t: (key: MessageKey) => string;
  loading: boolean;
  email: string;
  password: string;
  confirm: string;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setConfirm: (value: string) => void;
  recoveryMode: boolean;
  recoveryInvalid: boolean;
  isBusy: boolean;
  sent: boolean;
  completed: boolean;
  errorKey: MessageKey | null;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

function resolveDestination(userId: string | undefined): string {
  return resolvePostAuthDestination({
    userId,
    isOnboardingComplete,
  });
}

function hashIndicatesRecovery(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hash.includes('type=recovery');
}

export function useResetPasswordPageController(): ResetPasswordPageControllerView {
  const t = useT();
  const { session, loading, refreshSession } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryInvalid, setRecoveryInvalid] = useState(false);
  const [state, setState] = useState<ViewState>({ kind: 'idle' });

  useEffect(() => {
    if (hashIndicatesRecovery()) {
      setRecoveryMode(true);
    }
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true);
        setRecoveryInvalid(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!recoveryMode || loading) return;
    void refreshSession().then((nextSession) => {
      if (!nextSession && hashIndicatesRecovery()) {
        setRecoveryInvalid(true);
      }
    });
  }, [recoveryMode, loading, refreshSession]);

  useEffect(() => {
    if (loading || recoveryMode || state.kind === 'sent' || state.kind === 'completed') return;
    if (session) {
      void navigate({ to: resolveDestination(session.user.id) });
    }
  }, [session, loading, recoveryMode, state.kind, navigate]);

  const isBusy = state.kind === 'submitting';
  const sent = state.kind === 'sent';
  const completed = state.kind === 'completed';
  const errorKey = state.kind === 'error' ? authErrorMessageKey(state.code) : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy) return;

    if (recoveryMode && !recoveryInvalid) {
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

      setState({ kind: 'submitting' });
      const result = await updatePassword(password);
      if (!result.ok) {
        setState({ kind: 'error', code: result.code });
        return;
      }
      await supabase.auth.signOut();
      setPassword('');
      setConfirm('');
      setState({ kind: 'completed' });
      return;
    }

    const trimmed = email.trim();
    if (!trimmed) return setState({ kind: 'error', code: 'emailRequired' });
    if (!isValidEmail(trimmed)) return setState({ kind: 'error', code: 'emailInvalid' });

    setState({ kind: 'submitting' });
    const result = await sendPasswordReset(trimmed);
    if (!result.ok) {
      setState({ kind: 'error', code: result.code });
      return;
    }
    setRecoveryInvalid(false);
    setState({ kind: 'sent' });
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
    recoveryMode: recoveryMode && !recoveryInvalid,
    recoveryInvalid,
    isBusy,
    sent,
    completed,
    errorKey,
    handleSubmit,
  };
}
