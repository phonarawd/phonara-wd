/** §28.4 returning-user routing — pure guard for `/` beforeLoad. */
export type LandingRouteGuardInput = {
  search: string;
  hasSession: boolean;
  hasAccount: boolean;
};

export function parseLandingSearch(search: string): URLSearchParams {
  const normalized = search.startsWith('?') ? search.slice(1) : search;
  return new URLSearchParams(normalized);
}

export function resolveLandingRouteRedirect(
  input: LandingRouteGuardInput,
): '/home' | '/login' | null {
  if (parseLandingSearch(input.search).get('landing') === '1') return null;
  if (input.hasSession) return '/home';
  if (input.hasAccount) return '/login';
  return null;
}
