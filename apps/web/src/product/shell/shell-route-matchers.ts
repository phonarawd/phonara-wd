/**
 * §12.19 · §12.19.4 — AppShell route ownership (chrome mount + BottomNav active tab).
 */

export type BottomNavTabId = 'earn' | 'wallet' | 'trade' | 'sports' | 'casino';

/** Earn Tab route group — earnSubnav mounts when matched (§12.19.4). */
export const EARN_SURFACE_PREFIXES = [
  '/home',
  '/referral',
  '/tier',
  '/earn',
  '/events',
  '/share/earnings',
  '/staking',
  '/onboarding',
] as const;

const PUBLIC_AUTH_ROUTES = new Set(['/login', '/signup', '/reset-password', '/verify-email']);

export type MarketingShellVariant = 'landing' | 'auth';

export function resolveMarketingShellVariant(pathname: string): MarketingShellVariant {
  return normalizeShellPath(pathname) === '/' ? 'landing' : 'auth';
}

export function normalizeShellPath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function earnSurfaceRouteMatcher(pathname: string): boolean {
  const current = normalizeShellPath(pathname);
  // Exact `/tier` is P12 public marketing — not Earn AppShell chrome.
  if (current === '/tier') return false;
  return EARN_SURFACE_PREFIXES.some(
    (prefix) => current === prefix || current.startsWith(`${prefix}/`),
  );
}

export function resolveBottomNavTab(pathname: string): BottomNavTabId | null {
  const current = normalizeShellPath(pathname);

  if (earnSurfaceRouteMatcher(current)) return 'earn';
  if (
    current === '/wallet' ||
    current.startsWith('/wallet/') ||
    current === '/ledger' ||
    current.startsWith('/ledger/')
  ) {
    return 'wallet';
  }
  if (current === '/trade' || current.startsWith('/trade/')) return 'trade';
  if (current === '/sports' || current.startsWith('/sports/')) return 'sports';
  if (current === '/casino' || current.startsWith('/casino/') || current.startsWith('/games/')) {
    return 'casino';
  }

  return null;
}

/** §12.19.5 marketing zone — standalone shell (landing + auth + P12 public trust). */
export function shouldMountMarketingShell(pathname: string): boolean {
  const current = normalizeShellPath(pathname);

  if (current === '/') return true;
  if (PUBLIC_AUTH_ROUTES.has(current)) return true;
  if (current.startsWith('/auth')) return true;
  // P12 trust+marketing hub — public · AppShell chrome 0
  if (current === '/tier') return true;
  if (current === '/features' || current.startsWith('/features/')) return true;
  if (current === '/fees') return true;
  if (current === '/security') return true;
  // P12 community+support hub — public · AppShell chrome 0
  if (current === '/announcements') return true;
  if (current === '/status') return true;
  if (current === '/support' || current.startsWith('/support/')) return true;
  if (current === '/feedback') return true;

  return false;
}

/** Routes that mount global AppShell chrome (TopBar · BottomNav · domain subnav). */
export function shouldMountAppShell(pathname: string): boolean {
  const current = normalizeShellPath(pathname);

  if (shouldMountMarketingShell(current)) return false;
  if (current.startsWith('/legal')) return false;
  if (current.startsWith('/r/')) return false;

  if (resolveBottomNavTab(current) !== null) return true;

  return (
    current.startsWith('/account') ||
    current.startsWith('/settings') ||
    current.startsWith('/rewards') ||
    current.startsWith('/install') ||
    current.startsWith('/onboarding')
  );
}

export function tradeSurfaceRouteMatcher(pathname: string): boolean {
  const current = normalizeShellPath(pathname);
  return current === '/trade' || current.startsWith('/trade/');
}

export function sportsSurfaceRouteMatcher(pathname: string): boolean {
  const current = normalizeShellPath(pathname);
  return current === '/sports' || current.startsWith('/sports/');
}

export function casinoSurfaceRouteMatcher(pathname: string): boolean {
  const current = normalizeShellPath(pathname);
  return current === '/casino' || current.startsWith('/casino/') || current.startsWith('/games/');
}

export function walletSurfaceRouteMatcher(pathname: string): boolean {
  const current = normalizeShellPath(pathname);
  return (
    current === '/wallet' ||
    current.startsWith('/wallet/') ||
    current === '/ledger' ||
    current.startsWith('/ledger/')
  );
}
