/**
 * Aurora Mesh mount policy — §34.10 · PRODUCT_EXPERIENCE_CANON.
 * Earn/Wallet = low · Trade = off · other AppShell routes = off.
 */

import {
  earnSurfaceRouteMatcher,
  normalizeShellPath,
  tradeSurfaceRouteMatcher,
  walletSurfaceRouteMatcher,
} from './shell-route-matchers';

export type AuroraBackdropIntensity = 'off' | 'low';

export function resolveAuroraBackdropIntensity(pathname: string): AuroraBackdropIntensity {
  const current = normalizeShellPath(pathname);

  if (tradeSurfaceRouteMatcher(current)) return 'off';
  if (earnSurfaceRouteMatcher(current) || walletSurfaceRouteMatcher(current)) return 'low';

  return 'off';
}
