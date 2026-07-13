import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, relative, basename } from 'path';

const root = process.cwd();
const SKIP = new Set([
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

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (SKIP.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const allAbs = walk(root);
const rel = (p) => relative(root, p).replace(/\\/g, '/');
const all = allAbs.map(rel);

const testTs = all.filter((f) => f.endsWith('.test.ts') || f.endsWith('.spec.ts')).sort();
const testTsx = all.filter((f) => f.endsWith('.test.tsx') || f.endsWith('.spec.tsx')).sort();

function runnerBucket(f) {
  if (/^packages\/.+\.test\.ts$/.test(f)) return 'vitest:packages';
  if (/^tests\/.+\.test\.ts$/.test(f)) return 'vitest:tests';
  if (/^apps\/web\/src\/.+\.test\.ts$/.test(f)) return 'vitest:web';
  if (/^apps\/admin\/src\/.+\.test\.ts$/.test(f)) return 'vitest:admin';
  if (/^apps\/web\/src\/.+\.test\.tsx$/.test(f)) return 'vitest:web';
  if (/^apps\/admin\/src\/.+\.test\.tsx$/.test(f)) return 'vitest:admin';
  if (/^tests\/(smoke|e2e)\/.+\.spec\.ts$/.test(f)) return 'playwright';
  if (/^supabase\//.test(f)) return 'deno:supabase/_shared (manual)';
  return 'NO_RUNNER';
}

function runtimeKind(text, file) {
  if (/\bDeno\.test\s*\(/.test(text)) return 'deno';
  if (/@playwright\/test/.test(text) || /from\s+['"]@playwright\/test['"]/.test(text))
    return 'playwright';
  if (/from\s+['"]vitest['"]/.test(text)) return 'vitest';
  if (/\b(describe|it|test)\s*\(/.test(text)) return 'vitest-globals-or-api';
  if (file.includes('/e2e/') || file.includes('/smoke/')) return 'playwright-path';
  return 'unknown';
}

// Code/config corpus for path refs (exclude docs + self-audit)
const codeExt = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.json', '.yml', '.yaml']);
const isTest = (r) =>
  r.endsWith('.test.ts') ||
  r.endsWith('.spec.ts') ||
  r.endsWith('.test.tsx') ||
  r.endsWith('.spec.tsx');

const corpus = [];
for (const p of allAbs) {
  const r = rel(p);
  if (isTest(r)) continue;
  if (r.startsWith('docs/')) continue;
  if (r.includes('audit-test-refs') || r.includes('test-spec-file-audit')) continue;
  const base = basename(p);
  const ext = base.includes('.') ? '.' + base.split('.').pop() : '';
  if (!codeExt.has(ext)) continue;
  try {
    const text = readFileSync(p, 'utf8');
    if (text.length > 1_500_000) continue;
    corpus.push({ path: r, text });
  } catch {
    /* skip */
  }
}

const packageJson = readFileSync(join(root, 'package.json'), 'utf8');
const vitestConfig = readFileSync(join(root, 'vitest.config.ts'), 'utf8');
const playwrightConfig = readFileSync(join(root, 'playwright.config.ts'), 'utf8');
const ciYml = readFileSync(join(root, '.github/workflows/ci.yml'), 'utf8');

function findCodeRefs(file) {
  const refs = [];
  for (const c of corpus) {
    if (c.text.includes(file)) refs.push(c.path);
  }
  return [...new Set(refs)];
}

function classify(file, text) {
  const runtime = runtimeKind(text, file);
  const runner = runnerBucket(file);
  const refs = findCodeRefs(file);
  const inVitestDefault =
    runner.startsWith('vitest:') && runner !== 'deno:supabase/_shared (manual)';
  const inPlaywright = runner === 'playwright';
  const listedInTestEngine = packageJson.includes(file);
  const sourceModule = file.replace(/\.test\.ts$/, '.ts').replace(/\.spec\.ts$/, '.ts');
  const sourceExists = all.includes(sourceModule);

  // World-class verdict
  let verdict;
  let confidence;
  let notes = [];

  if (runtime === 'deno') {
    // Deno unit tests for Edge shared modules
    if (sourceExists) {
      notes.push('pairs with live Edge module ' + sourceModule);
    }
    if (listedInTestEngine) {
      notes.push(
        'listed in package.json test:engine BUT uses Deno.test — vitest cannot execute Deno.test',
      );
      verdict = 'Keep — Deno unit test (miswired in test:engine)';
      confidence = 'HIGH';
    } else {
      notes.push('not in vitest/playwright/CI automated suite');
      notes.push('ACTIVE_WORK_SSOT documents Deno 4/4 for ops-ntfy-dispatch');
      notes.push('delete = lose unit coverage for production Edge helpers');
      verdict = 'Keep — Deno unit test (manual / orphan from CI)';
      confidence = 'HIGH';
    }
  } else if (inVitestDefault || inPlaywright) {
    verdict = 'Keep — active suite';
    confidence = 'HIGH';
    if (refs.length) notes.push('also path-referenced in: ' + refs.slice(0, 3).join(', '));
    else notes.push('discovered by runner glob only (normal for tests)');
  } else if (refs.length) {
    verdict = 'Keep — referenced outside suite';
    confidence = 'MEDIUM';
    notes.push('refs: ' + refs.join(', '));
  } else {
    verdict = 'Safe to delete — no suite, no refs, no Deno pairing evidence';
    confidence = 'MEDIUM';
  }

  return {
    file,
    runtime,
    runner,
    sourceExists,
    sourceModule: sourceExists ? sourceModule : null,
    listedInTestEngine,
    codeRefs: refs,
    verdict,
    confidence,
    notes,
  };
}

const rows = [];
for (const f of testTs) {
  const text = readFileSync(join(root, f), 'utf8');
  rows.push(classify(f, text));
}

const denoRows = rows.filter((r) => r.runtime === 'deno');
const safeCandidates = rows.filter((r) => r.verdict.startsWith('Safe to delete'));
const keep = rows.filter((r) => r.verdict.startsWith('Keep'));

// Cross-check: any *.test.ts not matching any known runner AND not Deno?
const anomalies = rows.filter(
  (r) =>
    r.runner === 'NO_RUNNER' ||
    (r.runner.includes('supabase') && r.runtime !== 'deno') ||
    (r.listedInTestEngine && r.runtime === 'deno'),
);

// Producer modules used by Edge that have tests
const sharedModules = all
  .filter(
    (f) =>
      f.startsWith('supabase/functions/_shared/') && f.endsWith('.ts') && !f.endsWith('.test.ts'),
  )
  .sort();
const sharedCoverage = sharedModules.map((m) => {
  const test = m.replace(/\.ts$/, '.test.ts');
  return { module: m, hasTest: all.includes(test), testFile: all.includes(test) ? test : null };
});

const summary = {
  scope: {
    test_ts_spec_ts: testTs.length,
    test_tsx_spec_tsx: testTsx.length,
    note: 'Primary audit = *.test.ts + *.spec.ts only',
  },
  corrected_verdict: {
    Keep: keep.length,
    'Safe to delete': safeCandidates.length,
    previous_wrong_Safe_count: 5,
    correction:
      'Previous Safe-5 are all Deno.test files for live Edge _shared modules — NOT safe to delete',
  },
  runtime_breakdown: {
    deno: rows.filter((r) => r.runtime === 'deno').length,
    vitest: rows.filter((r) => r.runtime.startsWith('vitest')).length,
    playwright: rows.filter((r) => r.runtime.startsWith('playwright')).length,
    unknown: rows.filter((r) => r.runtime === 'unknown').length,
  },
  runner_breakdown: {},
  deno_files_detail: denoRows,
  safe_to_delete_after_correction: safeCandidates,
  anomalies,
  supabase_shared_module_coverage: sharedCoverage,
  ci_runs_deno_tests: /deno test|Deno\.test/.test(ciYml) ? true : false,
  package_json_test_engine_lists_deno_file: packageJson.includes(
    'supabase/functions/_shared/edge-observability.test.ts',
  ),
  vitest_include_covers_supabase: /supabase/.test(vitestConfig),
  playwright_covers_supabase: /supabase/.test(playwrightConfig),
};

for (const r of rows) {
  summary.runner_breakdown[r.runner] = (summary.runner_breakdown[r.runner] || 0) + 1;
}

writeFileSync(
  join(root, 'scripts', 'deep-test-audit-out.json'),
  JSON.stringify({ summary, rows }, null, 2),
);
console.log(JSON.stringify(summary, null, 2));
