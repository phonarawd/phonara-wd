/**
 * Phase R surface domain boundary SOT — Plan `phase_r_super-app_8bdf2c10` · §12.19 · SURFACE_BLUEPRINTS.
 * Each BottomNav chapter owns routes, surface folders, and feature imports only.
 * Cross-domain embed / parallel hub / wrong subnav = FAIL (`check:phase-r-guards`).
 */

export type SurfaceDomainId =
  | 'earn'
  | 'wallet'
  | 'trade'
  | 'sports'
  | 'casino'
  | 'account'
  | 'auth'
  | 'landing'
  | 'legal'
  | 'neutral';

export type SurfaceDomainSpec = {
  readonly id: SurfaceDomainId;
  /** Route prefixes owned by this domain (normalized, no trailing slash). */
  readonly routePrefixes: readonly string[];
  /** `product/surfaces/<folder>` names allowed for this domain. */
  readonly surfaceFolders: readonly string[];
  /** `features/<folder>` names allowed when imported from this domain's surfaces. */
  readonly featureFolders: readonly string[];
  /** Subnav registry file stem (without `-subnav.ts`) — only one mounts per route group. */
  readonly subnavStem: string | null;
  readonly descriptionKey: string;
};

/** 12 canonical casino game slugs — CASINO_UX_CANON §game list only. */
export const CASINO_GAME_SLUGS = [
  'crash',
  'limbo',
  'dice',
  'mines',
  'hilo',
  'plinko',
  'mint-reels',
  'gold-rush',
  'roulette',
  'blackjack',
  'deepshaft',
  'momentum',
] as const;

/** Shared import zones — never imply another product chapter. */
export const NEUTRAL_SURFACE_FOLDERS = [
  'shell',
  'legal',
  'landing',
  'login',
  'signup',
  'reset-password',
  'auth',
  'verify-email',
  'install',
] as const;

export const NEUTRAL_FEATURE_FOLDERS = ['auth', 'landing', 'pwa', 'responsible-gaming'] as const;

export const SURFACE_DOMAIN_SPECS: readonly SurfaceDomainSpec[] = [
  {
    id: 'earn',
    routePrefixes: ['/home', '/referral', '/tier', '/earn', '/share/earnings', '/onboarding'],
    surfaceFolders: ['home', 'referral', 'tier', 'share', 'onboarding'],
    featureFolders: ['earn', 'onboarding'],
    subnavStem: 'earn',
    descriptionKey: 'nav.earn',
  },
  {
    id: 'wallet',
    routePrefixes: ['/wallet', '/ledger', '/rewards'],
    surfaceFolders: ['wallet', 'rewards'],
    featureFolders: ['wallet', 'earn'],
    subnavStem: 'wallet',
    descriptionKey: 'nav.wallet',
  },
  {
    id: 'trade',
    routePrefixes: ['/trade', '/staking'],
    surfaceFolders: ['trade', 'staking'],
    featureFolders: ['trading', 'trade', 'earn'],
    subnavStem: 'trade',
    descriptionKey: 'nav.trade',
  },
  {
    id: 'sports',
    routePrefixes: ['/sports'],
    surfaceFolders: ['sports'],
    featureFolders: ['sports'],
    subnavStem: 'sports',
    descriptionKey: 'nav.sports',
  },
  {
    id: 'casino',
    routePrefixes: ['/casino', '/games'],
    surfaceFolders: ['casino', 'games'],
    featureFolders: ['casino'],
    subnavStem: 'casino',
    descriptionKey: 'nav.casino',
  },
  {
    id: 'account',
    routePrefixes: ['/account', '/settings', '/notifications'],
    surfaceFolders: ['account', 'settings', 'notifications'],
    featureFolders: ['account', 'settings', 'notifications'],
    subnavStem: null,
    descriptionKey: 'account.hub.title',
  },
] as const;

/** Patterns that indicate cross-domain embed or pre-demolition Bet hub — forbidden in product layer. */
const BET_HUB_EMBED = ['bet-hub', 'casino-embed'].join('-');
export const FORBIDDEN_CROSS_DOMAIN_PATTERNS: readonly RegExp[] = [
  new RegExp(BET_HUB_EMBED),
  /\bBetHub\b/,
  /\?section=(sports|casino|bet)\b/,
  /section=sports/,
  /section=casino/,
];

export type MobileLayoutForbiddenPattern = {
  readonly pattern: RegExp;
  readonly reason: string;
};

/** Mobile page-root anti-patterns — horizontal scroll / shell bypass on 390 viewport. */
export const MOBILE_LAYOUT_FORBIDDEN_PATTERNS: MobileLayoutForbiddenPattern[] = [
  {
    pattern: /\bmax-w-\[390px\]/,
    reason: '390px max-width bypasses ds-shell-content-column — use shell tokens',
  },
  {
    pattern: /\bw-\[390px\]/,
    reason: 'fixed 390px width causes horizontal scroll on smaller devices',
  },
  {
    pattern: /\bmin-w-\[(?:[5-9]\d{2}|\d{4,})px\]/,
    reason: 'page-root min-width ≥500px forces horizontal scroll on mobile',
  },
];

/** Surface files must not mount domain subnav registries — AppShell owns chrome. */
export const FORBIDDEN_SUBNAV_IMPORTS_IN_SURFACES =
  /from\s+['"][^'"]*\/(earn|trade|sports|casino|wallet)-subnav['"]/;

const DOMAIN_BY_FOLDER = new Map<string, SurfaceDomainId>();
for (const spec of SURFACE_DOMAIN_SPECS) {
  for (const folder of spec.surfaceFolders) {
    DOMAIN_BY_FOLDER.set(folder, spec.id);
  }
}

function normalizeRoutePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function resolveDomainForRoute(pathname: string): SurfaceDomainId | null {
  const current = normalizeRoutePath(pathname);
  for (const spec of SURFACE_DOMAIN_SPECS) {
    for (const prefix of spec.routePrefixes) {
      if (current === prefix || current.startsWith(`${prefix}/`)) {
        return spec.id;
      }
    }
  }
  if (current === '/' || current.startsWith('/login') || current.startsWith('/signup')) {
    return 'landing';
  }
  if (current.startsWith('/legal') || current.startsWith('/reset-password')) {
    return 'legal';
  }
  if (current.startsWith('/auth') || current.startsWith('/verify-email')) {
    return 'auth';
  }
  if (current.startsWith('/install')) {
    return 'neutral';
  }
  return null;
}

export function resolveDomainForSurfaceFolder(folder: string): SurfaceDomainId | null {
  if ((NEUTRAL_SURFACE_FOLDERS as readonly string[]).includes(folder)) {
    return 'neutral';
  }
  return DOMAIN_BY_FOLDER.get(folder) ?? null;
}

export function isAllowedCrossSurfaceImport(fromFolder: string, importedFolder: string): boolean {
  if (fromFolder === importedFolder) return true;
  if ((NEUTRAL_SURFACE_FOLDERS as readonly string[]).includes(importedFolder)) {
    return true;
  }
  const fromDomain = resolveDomainForSurfaceFolder(fromFolder);
  const toDomain = resolveDomainForSurfaceFolder(importedFolder);
  if (fromDomain === null || toDomain === null) return false;
  if (fromDomain === 'neutral' || toDomain === 'neutral') return true;
  return fromDomain === toDomain;
}

export function isAllowedFeatureImport(surfaceFolder: string, featureFolder: string): boolean {
  if ((NEUTRAL_FEATURE_FOLDERS as readonly string[]).includes(featureFolder)) {
    return true;
  }
  const domain = resolveDomainForSurfaceFolder(surfaceFolder);
  if (domain === null || domain === 'neutral' || domain === 'landing' || domain === 'legal') {
    return true;
  }
  const spec = SURFACE_DOMAIN_SPECS.find((s) => s.id === domain);
  if (!spec) return false;
  return (spec.featureFolders as readonly string[]).includes(featureFolder);
}

export function domainForSubnavStem(stem: string): SurfaceDomainId | null {
  const spec = SURFACE_DOMAIN_SPECS.find((s) => s.subnavStem === stem);
  return spec?.id ?? null;
}
