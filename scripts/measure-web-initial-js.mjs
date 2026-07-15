/**
 * Measure Stage1-style initial JS (gzip) from apps/web/dist.
 * Sums modulepreload + classic script assets referenced by dist/index.html,
 * plus CSS for reference. Writes JSON artifact when --out= is set.
 *
 * Usage (after `bun run build:web:production`):
 *   bun scripts/measure-web-initial-js.mjs
 *   bun scripts/measure-web-initial-js.mjs --out=docs/OPERATIONS/PLATFORM_AUDIT_CLOSEOUT_EVIDENCE/R9/r9-perf-js-measure-baseline.json
 */
import { gzipSync } from 'node:zlib';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

const root = process.cwd();
const distDir = join(root, 'apps/web/dist');
const htmlPath = join(distDir, 'index.html');
const outArg = process.argv.find((a) => a.startsWith('--out='));
const outPath = outArg ? join(root, outArg.slice('--out='.length)) : null;

if (!existsSync(htmlPath)) {
  console.error(
    '[measure-web-initial-js] missing apps/web/dist/index.html — run build:web:production first',
  );
  process.exit(1);
}

const html = readFileSync(htmlPath, 'utf8');
const assetRefs = new Set();

for (const m of html.matchAll(/modulepreload[^>]+href="([^"]+)"/g)) {
  assetRefs.add(m[1]);
}
for (const m of html.matchAll(/<script[^>]+src="([^"]+)"/g)) {
  assetRefs.add(m[1]);
}
for (const m of html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)) {
  assetRefs.add(m[1]);
}

const rows = [];
let jsGzip = 0;
let cssGzip = 0;

for (const href of [...assetRefs].sort()) {
  const file = href.startsWith('/') ? href.slice(1) : href;
  const abs = join(distDir, file);
  if (!existsSync(abs)) {
    console.warn(`[measure-web-initial-js] missing asset: ${href}`);
    continue;
  }
  const buf = readFileSync(abs);
  const gzip = gzipSync(buf, { level: 9 }).length;
  const kb = gzip / 1024;
  const kind = file.endsWith('.css') ? 'css' : 'js';
  if (kind === 'js') jsGzip += gzip;
  else cssGzip += gzip;
  rows.push({
    href,
    name: basename(file),
    kind,
    rawBytes: buf.length,
    gzipBytes: gzip,
    gzipKb: Number(kb.toFixed(2)),
  });
}

rows.sort((a, b) => b.gzipBytes - a.gzipBytes);

const summary = {
  measuredAt: new Date().toISOString(),
  sloGzipKb: 450,
  initialJsGzipKb: Number((jsGzip / 1024).toFixed(2)),
  initialCssGzipKb: Number((cssGzip / 1024).toFixed(2)),
  underSlo: jsGzip / 1024 <= 450,
  assetCount: rows.length,
  assets: rows,
};

console.log(
  `[measure-web-initial-js] initial JS gzip=${summary.initialJsGzipKb} kB · CSS=${summary.initialCssGzipKb} kB · SLO450=${summary.underSlo ? 'PASS' : 'FAIL'}`,
);
for (const row of rows.slice(0, 12)) {
  console.log(`  ${row.gzipKb.toFixed(2).padStart(7)} kB  ${row.kind}  ${row.name}`);
}

if (outPath) {
  writeFileSync(outPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  console.log(`[measure-web-initial-js] wrote ${outPath}`);
}
