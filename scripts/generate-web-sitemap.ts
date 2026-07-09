import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { buildSitemapXml, SITE_ORIGIN } from '../apps/web/src/lib/seo-config';

const repoRoot = join(import.meta.dirname, '..');
const outPath = join(repoRoot, 'apps/web/public/sitemap.xml');

const xml = buildSitemapXml(SITE_ORIGIN);

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, xml, 'utf8');

console.log(
  `[sitemap] wrote ${outPath} (${xml.split('<url>').length - 1} URLs → ${SITE_ORIGIN}/sitemap.xml)`,
);
