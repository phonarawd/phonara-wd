#!/usr/bin/env tsx
/**
 * Lovable paste post-check — G1~G4 + PASTE_SKIP + lockfile baseline.
 *
 * Usage:
 *   bun run lovable:postcheck
 *   bun run lovable:postcheck -- --capture-baseline
 */

import { execSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join, relative } from 'node:path';
import {
  LOVABLE_INTAKE_BASELINE_COMMIT,
  LOVABLE_INTAKE_BASELINE_LOCK,
  LOVABLE_INTAKE_ROOT,
  PASTE_SKIP_FILES,
  PASTE_SKIP_PREFIXES,
  POSTCHECK_ENGINE_PATH_RE,
  POSTCHECK_FORBIDDEN_IMPORT_RE,
  POSTCHECK_G1_PATTERNS,
  POSTCHECK_G2_FORMAT_RE,
  POSTCHECK_G2_MONEY_CONTEXT_RE,
  POSTCHECK_G2_NON_MONEY_OK_RE,
  POSTCHECK_G4_CSS_UNIVERSAL_RE,
  POSTCHECK_LOCKFILE_WATCH_PACKAGES,
  POSTCHECK_MOCK_DATA_RE,
} from './lib/lovable-paste-map';

const repoRoot = process.cwd();

type Hit = { file: string; line: number; text: string };

type SectionResult = {
  id: string;
  ok: boolean;
  message: string;
  hits?: Hit[];
  warn?: Hit[];
};

const TEXT_EXT = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.css',
  '.md',
  '.json',
  '.mjs',
  '.cjs',
]);

function parseArgs(): { shouldCaptureBaseline: boolean } {
  return { shouldCaptureBaseline: process.argv.includes('--capture-baseline') };
}

function walkFiles(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '_staging-pages') {
        continue;
      }
      walkFiles(full, acc);
      continue;
    }
    const ext = entry.name.slice(entry.name.lastIndexOf('.'));
    if (TEXT_EXT.has(ext)) acc.push(full);
  }
  return acc;
}

function scanRoots(roots: string[]): string[] {
  const files: string[] = [];
  for (const r of roots) {
    const abs = join(repoRoot, r);
    if (existsSync(abs)) {
      const st = statSync(abs);
      if (st.isDirectory()) walkFiles(abs, files);
      else files.push(abs);
    }
  }
  return files;
}

function findLineHits(file: string, re: RegExp): Hit[] {
  const rel = relative(repoRoot, file).replace(/\\/g, '/');
  const lines = readFileSync(file, 'utf8').split('\n');
  const hits: Hit[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (re.test(line)) hits.push({ file: rel, line: i + 1, text: line.trim().slice(0, 120) });
    re.lastIndex = 0;
  }
  return hits;
}

function checkEnginePathsFromGit(): SectionResult {
  let names: string[] = [];
  const baselineCommitPath = join(repoRoot, LOVABLE_INTAKE_BASELINE_COMMIT);
  const baselineCommit = existsSync(baselineCommitPath)
    ? readFileSync(baselineCommitPath, 'utf8').trim().split('\n')[0]?.trim()
    : '';
  const diffTarget =
    baselineCommit && baselineCommit !== 'no-git' ? baselineCommit : 'HEAD';
  try {
    const out = execSync(`git diff --name-only ${diffTarget}..HEAD`, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    if (out) names = out.split('\n').map((n) => n.trim()).filter(Boolean);
  } catch {
    names = [];
  }
  const bad = names.filter((n) => POSTCHECK_ENGINE_PATH_RE.test(n.replace(/\\/g, '/')));
  return {
    id: 'engine-skip',
    ok: bad.length === 0,
    message:
      bad.length === 0
        ? `No engine-path changes since ${diffTarget}`
        : `Engine paths touched since ${diffTarget}: ${bad.slice(0, 5).join(', ')}${bad.length > 5 ? ` (+${bad.length - 5})` : ''}`,
    hits: bad.map((file) => ({ file, line: 0, text: '(git diff)' })),
  };
}

function checkForbiddenImports(): SectionResult {
  const roots = ['apps/web/src/components/games', 'apps/web/src/presentation-import'];
  const files = scanRoots(roots);
  const hits: Hit[] = [];
  for (const f of files) {
    hits.push(
      ...findLineHits(f, POSTCHECK_FORBIDDEN_IMPORT_RE).filter(
        (h) => !h.text.includes('trade-engine-body'),
      ),
    );
  }
  return {
    id: 'forbidden-import',
    ok: hits.length === 0,
    message: hits.length === 0 ? 'No useMockPipeline / @/engine imports' : `${hits.length} forbidden import(s)`,
    hits,
  };
}

function checkG1(): SectionResult {
  const hits: Hit[] = [];
  for (const pat of POSTCHECK_G1_PATTERNS) {
    for (const f of scanRoots(pat.roots)) {
      hits.push(...findLineHits(f, pat.re));
    }
  }
  const filtered = hits.filter((h) => !h.file.includes('__tests__') && !h.file.endsWith('.test.ts'));
  return {
    id: 'G1-outcome-leak',
    ok: filtered.length === 0,
    message:
      filtered.length === 0
        ? 'G1 LAW1 — no RNG/crashAt/autobet-interval hits in game surfaces'
        : `G1 FAIL — ${filtered.length} suspect line(s)`,
    hits: filtered,
  };
}

function checkG2(): SectionResult {
  const roots = [
    'apps/web/src/components/trade',
    'apps/web/src/components/games',
    'apps/web/src/components/ui',
    'apps/web/src/presentation-import',
  ];
  const suspect: Hit[] = [];
  const okNonMoney: Hit[] = [];
  for (const f of scanRoots(roots)) {
    if (f.includes('__tests__') || f.endsWith('.test.ts')) continue;
    for (const hit of findLineHits(f, POSTCHECK_G2_FORMAT_RE)) {
      const ctx = hit.text;
      if (POSTCHECK_G2_MONEY_CONTEXT_RE.test(ctx) && !POSTCHECK_G2_NON_MONEY_OK_RE.test(ctx)) {
        suspect.push(hit);
      } else {
        okNonMoney.push(hit);
      }
    }
  }
  return {
    id: 'G2-formatter',
    ok: suspect.length === 0,
    message:
      suspect.length === 0
        ? `G2 — no money/price toLocaleString/toFixed (${okNonMoney.length} non-money OK)`
        : `G2 FAIL — ${suspect.length} money/price suspect formatter(s)`,
    hits: suspect,
    warn: okNonMoney,
  };
}

function checkMockData(): SectionResult {
  const roots = ['apps/web/src'];
  const hits: Hit[] = [];
  for (const f of scanRoots(roots)) {
    if (f.includes('__tests__') || f.includes('e2e-engine')) continue;
    hits.push(...findLineHits(f, POSTCHECK_MOCK_DATA_RE));
  }
  return {
    id: 'mock-data',
    ok: hits.length === 0,
    message: hits.length === 0 ? 'No DEMO/mock ticker residue' : `${hits.length} mock residue hit(s)`,
    hits,
  };
}

function checkG4Css(): SectionResult {
  const cssPath = join(repoRoot, 'apps/web/src/presentation-import/styles/lovable-globals.css');
  if (!existsSync(cssPath)) {
    return { id: 'G4-css', ok: true, message: 'lovable-globals.css absent (skip)' };
  }
  const content = readFileSync(cssPath, 'utf8');
  const hits: Hit[] = [];
  if (POSTCHECK_G4_CSS_UNIVERSAL_RE.test(content)) {
    hits.push({
      file: relative(repoRoot, cssPath).replace(/\\/g, '/'),
      line: 0,
      text: 'universal * / body / html selector — scope review required',
    });
  }
  return {
    id: 'G4-css',
    ok: hits.length === 0,
    message: hits.length === 0 ? 'G4 — no universal body/html reset in lovable-globals' : 'G4 WARN — CSS universal selectors',
    hits,
  };
}

function writeLockfileBaseline(): void {
  mkdirSync(join(repoRoot, LOVABLE_INTAKE_ROOT), { recursive: true });
  const lockSrc = join(repoRoot, 'bun.lock');
  if (existsSync(lockSrc)) {
    writeFileSync(join(repoRoot, LOVABLE_INTAKE_BASELINE_LOCK), readFileSync(lockSrc));
  }
  try {
    const commit = execSync('git rev-parse HEAD', { cwd: repoRoot, encoding: 'utf8' }).trim();
    writeFileSync(join(repoRoot, LOVABLE_INTAKE_BASELINE_COMMIT), `${commit}\n`);
  } catch {
    writeFileSync(join(repoRoot, LOVABLE_INTAKE_BASELINE_COMMIT), 'no-git\n');
  }
  console.log(`[postcheck] baseline → ${LOVABLE_INTAKE_BASELINE_LOCK}`);
}

function checkLockfileBaseline(): SectionResult {
  const baselinePath = join(repoRoot, LOVABLE_INTAKE_BASELINE_LOCK);
  const currentPath = join(repoRoot, 'bun.lock');
  if (!existsSync(baselinePath)) {
    return {
      id: 'G4-lockfile',
      ok: true,
      message: 'G4 — no baseline lock (run --capture-baseline before paste)',
    };
  }
  if (!existsSync(currentPath)) {
    return { id: 'G4-lockfile', ok: false, message: 'bun.lock missing' };
  }
  const baseline = readFileSync(baselinePath, 'utf8');
  const current = readFileSync(currentPath, 'utf8');
  if (baseline === current) {
    return { id: 'G4-lockfile', ok: true, message: 'G4 — bun.lock unchanged vs baseline' };
  }
  const changed: string[] = [];
  for (const pkg of POSTCHECK_LOCKFILE_WATCH_PACKAGES) {
    const bVer = baseline.match(new RegExp(`"${pkg}@[^"]+"`, 'g'));
    const cVer = current.match(new RegExp(`"${pkg}@[^"]+"`, 'g'));
    if (JSON.stringify(bVer) !== JSON.stringify(cVer)) changed.push(pkg);
  }
  return {
    id: 'G4-lockfile',
    ok: changed.length === 0,
    message:
      changed.length === 0
        ? 'G4 — bun.lock diff but watched packages stable'
        : `G4 FAIL — lockfile major drift: ${changed.join(', ')}`,
    hits: changed.map((pkg) => ({ file: 'bun.lock', line: 0, text: pkg })),
  };
}

function printHits(label: string, hits?: Hit[]) {
  if (!hits?.length) return;
  console.log(`\n  ${label}:`);
  for (const h of hits.slice(0, 30)) {
    console.log(`    ${h.file}${h.line ? `:${h.line}` : ''}  ${h.text}`);
  }
  if (hits.length > 30) console.log(`    ... +${hits.length -  30} more`);
}

function main() {
  const { shouldCaptureBaseline } = parseArgs();
  if (shouldCaptureBaseline) {
    writeLockfileBaseline();
    console.log('[postcheck] baseline captured — run lovable:postcheck for full guard scan');
    return;
  }

  console.log('\n=== lovable:postcheck ===\n');
  console.log('SKIP zones (must never be pasted):');
  for (const p of PASTE_SKIP_PREFIXES) console.log(`  ${p}`);
  for (const f of PASTE_SKIP_FILES) console.log(`  ${f}`);

  const sections: SectionResult[] = [
    checkEnginePathsFromGit(),
    checkForbiddenImports(),
    checkG1(),
    checkG2(),
    checkMockData(),
    checkG4Css(),
    checkLockfileBaseline(),
  ];

  let fail = 0;
  let warn = 0;
  for (const s of sections) {
    const icon = s.ok ? 'OK' : s.id === 'G4-css' && s.hits?.length ? 'WARN' : 'FAIL';
    if (!s.ok) {
      if (icon === 'WARN') warn++;
      else fail++;
    }
    console.log(`\n[${icon}] ${s.id}: ${s.message}`);
    printHits('hits', s.hits);
    if (s.warn?.length) printHits('non-money OK (info)', s.warn.slice(0, 5));
  }

  console.log(`\n=== postcheck ${fail === 0 ? 'PASS' : 'FAIL'} (${fail} fail, ${warn} warn) ===\n`);
  if (fail > 0) process.exit(1);
}

main();
