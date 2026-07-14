/**
 * Regenerate apps/web/public/sitemap.xml + robots.txt from seo-sitemap-contract SOT.
 *
 * Usage: bun run generate:web-seo
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  PHONARA_SITE_ORIGIN,
  SEO_PUBLIC_INDEXABLE_PATHS,
  SEO_ROBOTS_DISALLOW_PREFIXES,
  buildPhonaraSitemapUrl,
} from '../apps/web/src/domain/seo-sitemap-contract.ts';

const WEB_PUBLIC = join(process.cwd(), 'apps/web/public');
const LASTMOD = new Date().toISOString().slice(0, 10);

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function renderSitemapXml(): string {
  const urls = SEO_PUBLIC_INDEXABLE_PATHS.map((entry) => {
    const loc = escapeXml(buildPhonaraSitemapUrl(entry.path));
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${LASTMOD}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function renderRobotsTxt(): string {
  const disallowLines = SEO_ROBOTS_DISALLOW_PREFIXES.map(
    (prefix) => `Disallow: ${prefix}`,
  ).join('\n');

  return `User-agent: *
Allow: /

${disallowLines}

# AI Crawlers
User-agent: GPTBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: ${PHONARA_SITE_ORIGIN}/sitemap.xml
`;
}

function main(): void {
  writeFileSync(join(WEB_PUBLIC, 'sitemap.xml'), renderSitemapXml(), 'utf8');
  writeFileSync(join(WEB_PUBLIC, 'robots.txt'), renderRobotsTxt(), 'utf8');
  console.log(
    `[generate:web-seo] wrote sitemap.xml (${SEO_PUBLIC_INDEXABLE_PATHS.length} urls) + robots.txt`,
  );
}

main();
