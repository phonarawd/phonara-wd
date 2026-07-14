/**
 * Public SEO SOT — sitemap + robots.txt (pre-launch · launch).
 * Only marketing/legal/auth-entry paths that work without a session.
 * Login-walled hubs (/home, /trade, /casino, …) stay out until product policy changes.
 */

export const PHONARA_SITE_ORIGIN = 'https://phonara.net' as const;

export type SeoSitemapEntry = {
  readonly path: `/${string}` | '/';
  readonly changefreq: 'daily' | 'weekly' | 'monthly';
  readonly priority: number;
};

/** Canonical indexable paths — no §12.17 redirect-only aliases. */
export const SEO_PUBLIC_INDEXABLE_PATHS = [
  { path: '/', changefreq: 'daily', priority: 1 },
  { path: '/signup', changefreq: 'monthly', priority: 0.9 },
  { path: '/login', changefreq: 'monthly', priority: 0.7 },
  { path: '/reset-password', changefreq: 'monthly', priority: 0.4 },
  { path: '/install', changefreq: 'monthly', priority: 0.6 },
  { path: '/features/', changefreq: 'weekly', priority: 0.8 },
  { path: '/features/earn', changefreq: 'weekly', priority: 0.8 },
  { path: '/features/vip', changefreq: 'weekly', priority: 0.7 },
  { path: '/announcements', changefreq: 'weekly', priority: 0.7 },
  { path: '/events', changefreq: 'weekly', priority: 0.7 },
  { path: '/feedback', changefreq: 'monthly', priority: 0.5 },
  { path: '/fees', changefreq: 'monthly', priority: 0.6 },
  { path: '/status', changefreq: 'daily', priority: 0.5 },
  { path: '/support/', changefreq: 'monthly', priority: 0.6 },
  { path: '/support/faq', changefreq: 'monthly', priority: 0.6 },
  { path: '/legal/privacy', changefreq: 'monthly', priority: 0.4 },
  { path: '/legal/terms', changefreq: 'monthly', priority: 0.4 },
  { path: '/legal/responsible-gaming', changefreq: 'monthly', priority: 0.4 },
  { path: '/legal/cookies', changefreq: 'monthly', priority: 0.3 },
  { path: '/legal/affiliate', changefreq: 'monthly', priority: 0.4 },
  { path: '/legal/risk-disclosure', changefreq: 'monthly', priority: 0.4 },
] as const satisfies readonly SeoSitemapEntry[];

/** Crawl budget — session-only product surfaces (robots Disallow). */
export const SEO_ROBOTS_DISALLOW_PREFIXES = [
  '/account/',
  '/admin/',
  '/auth/',
  '/casino/',
  '/earn/',
  '/games/',
  '/home/',
  '/ledger/',
  '/notifications/',
  '/onboarding/',
  '/r/',
  '/referral/',
  '/rewards/',
  '/settings/',
  '/share/',
  '/sports/',
  '/staking/',
  '/tier/',
  '/trade/',
  '/verify-email',
  '/wallet/',
] as const;

export function buildPhonaraSitemapUrl(path: SeoSitemapEntry['path']): string {
  if (path === '/') return `${PHONARA_SITE_ORIGIN}/`;
  return `${PHONARA_SITE_ORIGIN}${path}`;
}

export function assertSeoSitemapContractSync(): void {
  const paths = SEO_PUBLIC_INDEXABLE_PATHS.map((entry) => entry.path);
  const unique = new Set(paths);
  if (unique.size !== paths.length) {
    throw new Error('seo-sitemap: duplicate public path');
  }
  for (const entry of SEO_PUBLIC_INDEXABLE_PATHS) {
    if (entry.priority < 0 || entry.priority > 1) {
      throw new Error(`seo-sitemap: priority out of range (${entry.path})`);
    }
  }
}
