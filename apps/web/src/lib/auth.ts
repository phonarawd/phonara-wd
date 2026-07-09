import { supabase } from './supabase';
import { authCallbackRedirect } from './auth-redirect';
import type { Session } from '@supabase/supabase-js';

export async function sendMagicLink(email: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: authCallbackRedirect('/home'),
    },
  });
  return { error: error?.message ?? null };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** Fail-open session probe for route guards — mirrors AuthProvider bootstrap timeout. */
export async function getSessionWithTimeout(timeoutMs = 10_000): Promise<Session | null> {
  return Promise.race([
    getSession(),
    new Promise<null>((resolve) => {
      window.setTimeout(() => resolve(null), timeoutMs);
    }),
  ]);
}

// ─── Email + password auth ──────────────────────────────────────────────────
// Password auth is the primary path (familiar for all users); Magic Link above
// stays as the secondary passwordless option. All helpers below return a typed
// AuthResult so routes never render raw provider error strings — they map a
// stable `code` to an i18n message instead.

export type AuthStatus = 'verify_email' | 'magic_link_sent' | 'reset_sent' | 'password_updated';

export type AuthErrorCode =
  | 'invalidCredentials'
  | 'emailInvalid'
  | 'emailAlreadyRegistered'
  | 'emailNotConfirmed'
  | 'passwordTooShort'
  | 'passwordWeak'
  | 'rateLimited'
  | 'network'
  | 'generic';

export type AuthResult =
  | { ok: true; status?: AuthStatus; session?: Session }
  | { ok: false; code: AuthErrorCode };

function mapSupabaseError(error: unknown): AuthErrorCode {
  if (error instanceof TypeError) return 'network';
  const record =
    typeof error === 'object' && error !== null
      ? (error as { message?: unknown; status?: unknown; code?: unknown })
      : null;
  const message = record?.message != null ? String(record.message) : '';
  const lower = message.toLowerCase();
  const status = typeof record?.status === 'number' ? record.status : undefined;
  const code = record?.code != null ? String(record.code).toLowerCase() : '';

  if (
    status === 429 ||
    code === 'over_email_send_rate_limit' ||
    code === 'over_request_rate_limit' ||
    lower.includes('rate limit') ||
    lower.includes('too many requests')
  ) {
    return 'rateLimited';
  }
  if (
    code === 'email_not_confirmed' ||
    lower.includes('email not confirmed') ||
    lower.includes('email address not confirmed')
  ) {
    return 'emailNotConfirmed';
  }
  if (
    lower.includes('invalid login credentials') ||
    lower.includes('invalid_grant') ||
    lower.includes('invalid email or password')
  ) {
    return 'invalidCredentials';
  }
  if (lower.includes('email') && (lower.includes('invalid') || lower.includes('valid'))) {
    return 'emailInvalid';
  }
  if (
    code === 'user_already_exists' ||
    code === 'email_exists' ||
    lower.includes('already registered') ||
    lower.includes('user already registered')
  ) {
    return 'emailAlreadyRegistered';
  }
  if (
    code === 'weak_password' ||
    lower.includes('weak_password') ||
    (lower.includes('password') &&
      lower.includes('character of each') &&
      lower.includes('abcdefghijklmnopqrstuvwxyz'))
  ) {
    return 'passwordWeak';
  }
  if (lower.includes('password') && (lower.includes('short') || lower.includes('6 characters'))) {
    return 'passwordTooShort';
  }
  if (
    code === 'anonymous_provider_disabled' ||
    code === 'signup_disabled' ||
    lower.includes('signup is disabled')
  ) {
    return 'generic';
  }
  if (code === 'validation_failed' || lower.includes('unable to validate email')) {
    return 'emailInvalid';
  }
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('failed to fetch')) {
    return 'network';
  }
  return 'generic';
}

function resetRedirect(): string | undefined {
  return authCallbackRedirect('/reset-password');
}

export async function resendSignupVerification(email: string): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: { emailRedirectTo: authCallbackRedirect('/home') },
    });
    if (error) return { ok: false, code: mapSupabaseError(error) };
    return { ok: true, status: 'verify_email' };
  } catch (error) {
    return { ok: false, code: mapSupabaseError(error) };
  }
}

export async function signInWithPassword(email: string, password: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, code: mapSupabaseError(error) };
    return data.session ? { ok: true, session: data.session } : { ok: false, code: 'generic' };
  } catch (error) {
    return { ok: false, code: mapSupabaseError(error) };
  }
}

export async function signUpWithPassword(email: string, password: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: authCallbackRedirect('/home') },
    });
    if (error) return { ok: false, code: mapSupabaseError(error) };
    // When email confirmation is required Supabase returns no session — show the
    // verify-email state. When confirmation is disabled a session is returned
    // immediately and the caller can route straight to the dashboard.
    if (data.session) return { ok: true, session: data.session };
    return { ok: true, status: 'verify_email' };
  } catch (error) {
    return { ok: false, code: mapSupabaseError(error) };
  }
}

export async function sendPasswordReset(email: string): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetRedirect(),
    });
    if (error) return { ok: false, code: mapSupabaseError(error) };
    return { ok: true, status: 'reset_sent' };
  } catch (error) {
    return { ok: false, code: mapSupabaseError(error) };
  }
}

export async function signInWithPasskey(): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPasskey();
    if (error) return { ok: false, code: mapSupabaseError(error) };
    return data.session ? { ok: true, session: data.session } : { ok: false, code: 'generic' };
  } catch (error) {
    return { ok: false, code: mapSupabaseError(error) };
  }
}

export async function updatePassword(password: string): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { ok: false, code: mapSupabaseError(error) };
    return { ok: true, status: 'password_updated' };
  } catch (error) {
    return { ok: false, code: mapSupabaseError(error) };
  }
}
