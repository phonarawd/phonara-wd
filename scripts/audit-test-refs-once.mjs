import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, relative, basename } from 'path';

const root = process.cwd();
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  '.git',
  'coverage',
  'test-results',
  'playwright-report',
  '.tmp',
  '.vite',
  'blob-report',
]);

function walkFiles(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walkFiles(p, out);
    else out.push(p);
  }
  return out;
}

const allFiles = walkFiles(root);
const rel = (p) => relative(root, p).replace(/\\/g, '/');
const testTs = allFiles
  .map(rel)
  .filter((f) => f.endsWith('.test.ts') || f.endsWith('.spec.ts'))
  .sort();
const isTestFile = (r) =>
  r.endsWith('.test.ts') ||
  r.endsWith('.spec.ts') ||
  r.endsWith('.test.tsx') ||
  r.endsWith('.spec.tsx');

const codeExt = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.json']);
const codeFiles = allFiles.filter((p) => {
  const r = rel(p);
  if (isTestFile(r) || r.startsWith('docs/') || r.includes('audit-test-refs')) return false;
  const base = basename(p);
  const ext = base.includes('.') ? '.' + base.split('.').pop() : '';
  return codeExt.has(ext);
});

const codeContents = [];
for (const p of codeFiles) {
  try {
    const text = readFileSync(p, 'utf8');
    if (text.length > 2_000_000) continue;
    codeContents.push({ path: rel(p), text });
  } catch {
    /* skip */
  }
}

const testContents = [];
for (const p of allFiles.filter((x) => isTestFile(rel(x)))) {
  try {
    testContents.push({ path: rel(p), text: readFileSync(p, 'utf8') });
  } catch {
    /* skip */
  }
}

function runnerCoverage(f) {
  if (/^packages\/.+\.test\.ts$/.test(f)) return 'vitest:packages';
  if (/^tests\/.+\.test\.ts$/.test(f)) return 'vitest:tests';
  if (/^apps\/web\/src\/.+\.test\.ts$/.test(f)) return 'vitest:web';
  if (/^apps\/admin\/src\/.+\.test\.ts$/.test(f)) return 'vitest:admin';
  if (/^tests\/(smoke|e2e)\/.+\.spec\.ts$/.test(f)) return 'playwright';
  if (/^supabase\/functions\/_shared\/.+\.test\.ts$/.test(f)) return 'orphan:supabase/_shared';
  return 'NO_RUNNER';
}

function findRefs(file) {
  const base = basename(file);
  const refs = [];
  for (const c of codeContents) {
    if (c.text.includes(file)) {
      refs.push(c.path);
      if (refs.length >= 4) break;
    }
  }
  for (const c of testContents) {
    if (c.path === file) continue;
    const escaped = base.replace(/\./g, '\\.');
    if (new RegExp(`from\\s+['"][^'"]*${escaped}['"]`).test(c.text)) {
      refs.push(c.path + ' (import)');
      if (refs.length >= 6) break;
    }
  }
  return refs;
}

const rows = [];
for (const f of testTs) {
  const runner = runnerCoverage(f);
  const refs = findRefs(f);
  const inSuite = [
    'vitest:packages',
    'vitest:tests',
    'vitest:web',
    'vitest:admin',
    'playwright',
  ].includes(runner);
  let classification, reason;
  if (inSuite) {
    classification = 'Keep';
    reason = refs.length ? `runner + code ref` : 'runner discovery (no direct import)';
  } else if (refs.length) {
    classification = 'Keep';
    reason = 'code ref only';
  } else {
    classification = 'Safe to delete';
    reason = 'no runner + no refs';
  }
  rows.push({
    file: f,
    classification,
    hasCodeRef: refs.length > 0,
    runner,
    refs: refs.slice(0, 3),
    reason,
  });
}

writeFileSync(join(root, 'scripts', 'audit-test-refs-data.json'), JSON.stringify(rows));
console.log(
  JSON.stringify(
    {
      total: rows.length,
      Keep: rows.filter((r) => r.classification === 'Keep').length,
      Safe: rows.filter((r) => r.classification === 'Safe to delete').length,
      withRef: rows.filter((r) => r.hasCodeRef).length,
      safe: rows.filter((r) => r.classification === 'Safe to delete').map((r) => r.file),
    },
    null,
    2,
  ),
);
