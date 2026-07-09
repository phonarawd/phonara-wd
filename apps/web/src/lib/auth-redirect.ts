/** Auth email links (confirm signup, reset password, magic link) land here first. */
export const AUTH_CALLBACK_PATH = '/auth/callback';

export function authCallbackRedirect(next = '/home'): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const url = new URL(AUTH_CALLBACK_PATH, window.location.origin);
  if (next && next !== '/home') url.searchParams.set('next', next);
  return url.toString();
}

export function isLocalSupabaseUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === '127.0.0.1' || host === 'localhost';
  } catch {
    return false;
  }
}

/** Local Supabase CLI captures auth mail in Mailpit (see `supabase status`). */
export const LOCAL_INBUCKET_URL = 'http://127.0.0.1:54324';
