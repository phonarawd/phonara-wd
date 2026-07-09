/** §28.4 returning-user routing — pure guard for `/` beforeLoad. */
export type LandingRouteGuardInput = {
  search: string;
  hasSession: boolean;
  hasAccount: boolean;
};

export function resolveLandingRouteRedirect(
  input: LandingRouteGuardInput,
): '/home' | '/login' | null {
  if (new URLSearchParams(input.search).get('landing') === '1') return null;
  if (input.hasSession) return '/home';
  if (input.hasAccount) return '/login';
  return null;
}
