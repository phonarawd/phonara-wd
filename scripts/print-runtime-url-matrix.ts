#!/usr/bin/env tsx
/**
 * Print / validate R9 runtime URL matrix (124 concrete URLs).
 * SOT: docs/OPERATIONS/PLATFORM_RUNTIME_URL_MATRIX.json
 *
 * Usage:
 *   bun run audit:runtime-urls
 *   bun run audit:runtime-urls -- --json
 *   bun run audit:runtime-urls -- --stage1
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type UrlEntry = string | { path: string; parameterized?: boolean };

type MatrixDoc = {
  formula: { webConcrete: number; adminConcrete: number; totalConcrete: number };
  stage1: {
    criticalSurfaces: Array<{ id: string; label: string; app: string; path: string }>;
    viewports: Array<{ width: number; height: number; tier: string }>;
  };
  previewOrigins: { web: string; admin: string };
  webUrls: Record<string, UrlEntry[]>;
  adminUrls: Record<string, UrlEntry[]>;
};

function flattenUrls(
  groups: Record<string, UrlEntry[]>,
): Array<{ group: string; path: string; parameterized: boolean }> {
  const out: Array<{ group: string; path: string; parameterized: boolean }> = [];
  for (const [group, entries] of Object.entries(groups)) {
    for (const entry of entries) {
      if (typeof entry === 'string') {
        out.push({ group, path: entry, parameterized: false });
      } else {
        out.push({ group, path: entry.path, parameterized: entry.parameterized === true });
      }
    }
  }
  return out;
}

const matrixPath = resolve('docs/OPERATIONS/PLATFORM_RUNTIME_URL_MATRIX.json');
const doc = JSON.parse(readFileSync(matrixPath, 'utf8')) as MatrixDoc;

const web = flattenUrls(doc.webUrls);
const admin = flattenUrls(doc.adminUrls);
const webConcrete = web;
const adminConcrete = admin;

const errors: string[] = [];
if (webConcrete.length !== doc.formula.webConcrete) {
  errors.push(`web concrete ${webConcrete.length} !== expected ${doc.formula.webConcrete}`);
}
if (adminConcrete.length !== doc.formula.adminConcrete) {
  errors.push(`admin concrete ${adminConcrete.length} !== expected ${doc.formula.adminConcrete}`);
}
const total = webConcrete.length + adminConcrete.length;
if (total !== doc.formula.totalConcrete) {
  errors.push(`total concrete ${total} !== expected ${doc.formula.totalConcrete}`);
}

const json = process.argv.includes('--json');
const stage1Only = process.argv.includes('--stage1');

if (stage1Only) {
  const surfaces = doc.stage1.criticalSurfaces;
  const vps = doc.stage1.viewports;
  console.log(
    `# R9 Stage1 — Critical ${surfaces.length} × viewports ${vps.length} = ${surfaces.length * vps.length} states`,
  );
  for (const s of surfaces) {
    const origin = s.app === 'admin' ? doc.previewOrigins.admin : doc.previewOrigins.web;
    console.log(`\n## ${s.label} (${s.id})`);
    for (const vp of vps) {
      console.log(`- ${vp.width}×${vp.height} → ${origin}${s.path}`);
    }
  }
} else if (json) {
  console.log(
    JSON.stringify(
      {
        webConcrete: webConcrete.map((u) => u.path),
        adminConcrete: adminConcrete.map((u) => u.path),
        parameterized: [...web, ...admin].filter((u) => u.parameterized).map((u) => u.path),
        counts: { web: webConcrete.length, admin: adminConcrete.length, total },
      },
      null,
      2,
    ),
  );
} else {
  console.log(`# PLATFORM_RUNTIME_URL_MATRIX — ${matrixPath}`);
  console.log(
    `web concrete: ${webConcrete.length} · admin concrete: ${adminConcrete.length} · total: ${total}`,
  );
  console.log(
    `Stage1 critical: ${doc.stage1.criticalSurfaces.length} surfaces · viewports: ${doc.stage1.viewports.map((v) => v.width).join(' · ')}`,
  );
  console.log('\n## Web');
  for (const u of webConcrete) {
    console.log(`- ${u.path} (${u.group})`);
  }
  console.log('\n## Admin');
  for (const u of adminConcrete) {
    console.log(`- ${u.path} (${u.group})`);
  }
  const param = [...web, ...admin].filter((u) => u.parameterized);
  if (param.length > 0) {
    console.log('\n## Parameterized (Stage2 seed)');
    for (const u of param) {
      console.log(`- ${u.path} (${u.group})`);
    }
  }
}

if (errors.length > 0) {
  console.error('\n[audit:runtime-urls] FAIL');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.error(`\n[audit:runtime-urls] OK — ${total} concrete URLs`);
