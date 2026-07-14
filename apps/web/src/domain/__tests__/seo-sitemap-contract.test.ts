import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  PHONARA_SITE_ORIGIN,
  SEO_PUBLIC_INDEXABLE_PATHS,
  SEO_ROBOTS_DISALLOW_PREFIXES,
  assertSeoSitemapContractSync,
  buildPhonaraSitemapUrl,
} from '../seo-sitemap-contract';
import { isRedirectOnlyPath } from '@/product/routing';

const WEB_PUBLIC = join(process.cwd(), 'apps/web/public');

describe('seo-sitemap-contract', () => {
  it('syncs bundle invariants', () => {
    expect(() => assertSeoSitemapContractSync()).not.toThrow();
  });

  it('uses only canonical paths (no §12.17 redirect-only aliases)', () => {
    for (const entry of SEO_PUBLIC_INDEXABLE_PATHS) {
      expect(isRedirectOnlyPath(entry.path)).toBe(false);
    }
  });

  it('matches generated sitemap.xml on disk', () => {
    const xml = readFileSync(join(WEB_PUBLIC, 'sitemap.xml'), 'utf8');
    for (const entry of SEO_PUBLIC_INDEXABLE_PATHS) {
      expect(xml).toContain(`<loc>${buildPhonaraSitemapUrl(entry.path)}</loc>`);
    }
    expect(xml).not.toContain('<loc>https://phonara.net/about</loc>');
    expect(xml).not.toContain('<loc>https://phonara.net/auth/callback</loc>');
    expect(xml).not.toContain('<loc>https://phonara.net/casino/crash</loc>');
  });

  it('lists session-only prefixes in robots disallow SOT', () => {
    expect(SEO_ROBOTS_DISALLOW_PREFIXES).toContain('/wallet/');
    expect(SEO_ROBOTS_DISALLOW_PREFIXES).toContain('/trade/');
    expect(SEO_ROBOTS_DISALLOW_PREFIXES).toContain('/auth/');
  });

  it('matches generated robots.txt sitemap line', () => {
    const robots = readFileSync(join(WEB_PUBLIC, 'robots.txt'), 'utf8');
    expect(robots).toContain(`Sitemap: ${PHONARA_SITE_ORIGIN}/sitemap.xml`);
    expect(robots).toContain('Disallow: /wallet/');
  });

  it('ships Google and Naver HTML ownership verification files', () => {
    const google = readFileSync(join(WEB_PUBLIC, 'googleb262cce23bd3d508.html'), 'utf8');
    const naver = readFileSync(join(WEB_PUBLIC, 'naverba24284efb230dee9f04ad79fee9a841.html'), 'utf8');
    expect(google.trim()).toBe('google-site-verification: googleb262cce23bd3d508.html');
    expect(naver.trim()).toBe('naver-site-verification: naverba24284efb230dee9f04ad79fee9a841.html');
  });
});
