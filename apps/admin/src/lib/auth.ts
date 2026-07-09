import type { Session } from '@supabase/supabase-js';

import { supabase } from './supabase';

export type AuthErrorCode =
  | 'invalidCredentials'
  | 'emailInvalid'
  | 'emailNotConfirmed'
  | 'rateLimited'
  | 'network'
  | 'generic';

export type AuthResult = { ok: true; session: Session } | { ok: false; code: AuthErrorCode };

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
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('failed to fetch')) {
    return 'network';
  }
  return 'generic';
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

/** @deprecated Prefer {@link signInWithPassword}. */
export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.replace('/login');
}

export async function signOutLocal() {
  await supabase.auth.signOut({ scope: 'local' });
}
