#!/usr/bin/env tsx
/**
 * Lovable ZIP intake: extract → validate → paste plan (dry-run).
 * PHONARA paste 본 실행은 operator 「PHONARA paste GO」 후 별도 Wave.
 *
 * Usage:
 *   bun run lovable:intake -- --zip path/to/lovable-export.zip
 *   bun run lovable:intake -- --validate
 *   bun run lovable:intake -- --plan
 *   bun run lovable:intake -- --clean
 */

import { execSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join, relative, resolve } from 'node:path';
import {
  LOVABLE_INTAKE_INCOMING,
  LOVABLE_INTAKE_ROOT,
  LOVABLE_INTAKE_STAGING,
  PASTE_DIRECTORY_RULES,
  PASTE_PAGE_RULES,
  PASTE_SKIP_FILES,
  PASTE_SKIP_PREFIXES,
  RELEASE_BLOCK_PATTERNS,
  SECRET_SCAN_PATTERNS,
  type PasteRule,
} from './lib/lovable-paste-map';

const repoRoot = process.cwd();

type CliArgs = {
  zip?: string;
  validate: boolean;
  plan: boolean;
  clean: boolean;
  help: boolean;
};

function parseArgs(argv: string[]): CliArgs {
  const out: CliArgs = { validate: false, plan: false, clean: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--zip') out.zip = argv[++i];
    else if (a === '--validate') out.validate = true;
    else if (a === '--plan') out.plan = true;
    else if (a === '--clean') out.clean = true;
    else if (a === '--help' || a === '-h') out.help = true;
  }
  if (!out.validate && !out.plan && !out.clean && !out.zip && !out.help) {
    out.validate = true;
    out.plan = true;
  }
  return out;
}

function printHelp() {
  console.log(`Lovable paste intake (staging only — no auto-paste)

  bun run lovable:intake -- --zip <path>   Extract ZIP to ${LOVABLE_INTAKE_STAGING}
  bun run lovable:intake -- --validate     Scan staging (default with --zip)
  bun run lovable:intake -- --plan         Print COPY/ADAPT/MERGE plan
  bun run lovable:intake -- --clean        Remove ${LOVABLE_INTAKE_STAGING}

Drop ZIP in: ${LOVABLE_INTAKE_INCOMING}/
Paste GO: operator 「PHONARA paste GO Wave-1」 (or Wave-N) — intake does NOT apply paste.
`);
}

function ensureDirs() {
  mkdirSync(join(repoRoot, LOVABLE_INTAKE_INCOMING), { recursive: true });
  mkdirSync(join(repoRoot, LOVABLE_INTAKE_STAGING), { recursive: true });
}

function cleanStaging() {
  const staging = join(repoRoot, LOVABLE_INTAKE_STAGING);
  if (existsSync(staging)) {
    rmSync(staging, { recursive: true, force: true });
  }
  mkdirSync(staging, { recursive: true });
  console.log(`[intake] cleaned ${LOVABLE_INTAKE_STAGING}`);
}

function extractZip(zipPath: string) {
  const abs = resolve(zipPath);
  if (!existsSync(abs)) {
    console.error(`[intake] ZIP not found: ${abs}`);
    process.exit(1);
  }
  cleanStaging();
  const dest = join(repoRoot, LOVABLE_INTAKE_STAGING);
  if (process.platform === 'win32') {
    execSync(
      `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${abs.replace(/'/g, "''")}' -DestinationPath '${dest.replace(/'/g, "''")}' -Force"`,
      { stdio: 'inherit' },
    );
  } else {
    execSync(`unzip -qo "${abs}" -d "${dest}"`, { stdio: 'inherit' });
  }
  console.log(`[intake] extracted → ${LOVABLE_INTAKE_STAGING}`);
}

function walkFiles(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkFiles(p, acc);
    else acc.push(p);
  }
  return acc;
}

function findSrcRoot(stagingRoot: string): string {
  const direct = join(stagingRoot, 'src');
  if (existsSync(join(direct, 'i18n')) || existsSync(join(direct, 'components'))) {
    return direct;
  }
  for (const entry of readdirSync(stagingRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const nested = join(stagingRoot, entry.name, 'src');
    if (existsSync(nested)) return nested;
  }
  throw new Error(`[intake] Lovable src/ not found under ${LOVABLE_INTAKE_STAGING}`);
}

function relFromSrc(srcRoot: string, filePath: string): string {
  return relative(srcRoot, filePath).replace(/\\/g, '/');
}

function shouldSkip(relPath: string): boolean {
  for (const prefix of PASTE_SKIP_PREFIXES) {
    if (relPath.startsWith(prefix) || relPath.includes(`/${prefix}`)) return true;
  }
  for (const f of PASTE_SKIP_FILES) {
    if (relPath === f || relPath.endsWith(`/${f}`)) return true;
  }
  return false;
}

function matchRule(relPath: string): PasteRule | undefined {
  for (const rule of PASTE_DIRECTORY_RULES) {
    if (relPath === rule.lovableGlob || relPath.startsWith(`${rule.lovableGlob}/`)) {
      return rule;
    }
  }
  return undefined;
}

type ValidationReport = {
  srcRoot: string;
  totalFiles: number;
  codeFiles: number;
  secretHits: { file: string; pattern: string }[];
  releaseHits: { file: string; pattern: string }[];
  skipCount: number;
  zoneCounts: Record<string, number>;
  i18n: { koKeys: number; enKeys: number; koSports: number; enSports: number };
  gamesPresent: string[];
  pagesPresent: string[];
  pagesMissing: string[];
  stagingRoot: string;
};

function countI18nKeys(content: string): number {
  return (content.match(/^ {2}"/gm) ?? []).length;
}

function countSportsKeys(content: string): number {
  return (content.match(/"sports\.|"nav\.sports"/g) ?? []).length;
}

function validateStaging(): ValidationReport {
  const stagingRoot = join(repoRoot, LOVABLE_INTAKE_STAGING);
  const srcRoot = findSrcRoot(stagingRoot);
  const allFiles = walkFiles(stagingRoot);
  const srcFiles = walkFiles(srcRoot);

  const secretHits: ValidationReport['secretHits'] = [];
  const releaseHits: ValidationReport['releaseHits'] = [];
  const zoneCounts: Record<string, number> = {};
  let skipCount = 0;

  const codeExt = /\.(tsx?|css|json|md)$/i;
  let codeFiles = 0;

  for (const file of srcFiles) {
    const rel = relFromSrc(srcRoot, file);
    if (shouldSkip(rel)) {
      skipCount++;
      continue;
    }
    if (!codeExt.test(file)) continue;
    codeFiles++;

    const rule = matchRule(rel);
    const zone = rule?.lovableGlob ?? rel.split('/')[0] ?? 'other';
    zoneCounts[zone] = (zoneCounts[zone] ?? 0) + 1;

    const text = readFileSync(file, 'utf8');
    for (const pat of SECRET_SCAN_PATTERNS) {
      if (pat.test(text)) secretHits.push({ file: rel, pattern: pat.source });
    }
    if (/\.(tsx?|jsx?)$/.test(file)) {
      for (const pat of RELEASE_BLOCK_PATTERNS) {
        if (pat.test(text)) releaseHits.push({ file: rel, pattern: pat.source });
      }
    }
  }

  const readI18n = (name: string) => {
    const p = join(srcRoot, 'i18n', name);
    return existsSync(p) ? readFileSync(p, 'utf8') : '';
  };
  const ko = readI18n('ko.ts');
  const en = readI18n('en.ts');

  const gamesDir = join(srcRoot, 'games');
  const gamesPresent = existsSync(gamesDir)
    ? readdirSync(gamesDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort()
    : [];

  const pagesPresent: string[] = [];
  const pagesMissing: string[] = [];
  for (const { lovableRoute } of PASTE_PAGE_RULES) {
    const p = join(srcRoot, lovableRoute);
    if (existsSync(p)) pagesPresent.push(lovableRoute);
    else pagesMissing.push(lovableRoute);
  }

  return {
    srcRoot,
    stagingRoot,
    totalFiles: allFiles.length,
    codeFiles,
    secretHits,
    releaseHits: releaseHits.slice(0, 40),
    skipCount,
    zoneCounts,
    i18n: {
      koKeys: countI18nKeys(ko),
      enKeys: countI18nKeys(en),
      koSports: countSportsKeys(ko),
      enSports: countSportsKeys(en),
    },
    gamesPresent,
    pagesPresent,
    pagesMissing,
  };
}

function printPlan(report: ValidationReport) {
  console.log('\n=== Paste plan (dry-run · operator GO 전 적용 금지) ===\n');
  for (const rule of PASTE_DIRECTORY_RULES) {
    const srcDir = join(report.srcRoot, rule.lovableGlob);
    const count = existsSync(srcDir)
      ? walkFiles(srcDir).filter((f) => !f.includes('__tests__')).length
      : 0;
    const status = count > 0 ? `${count} files` : 'MISSING';
    console.log(
      `  [${rule.action.padEnd(5)}] src/${rule.lovableGlob} → ${rule.phonaraDir} (${status})${rule.note ? ` · ${rule.note}` : ''}`,
    );
  }
  console.log('\n  Pages (ADAPT → Imported*Page export 유지):');
  for (const { lovableRoute, phonaraPage } of PASTE_PAGE_RULES) {
    const hit = report.pagesPresent.includes(lovableRoute) ? 'OK' : 'missing';
    console.log(`    ${lovableRoute} → ${phonaraPage} [${hit}]`);
  }
  console.log('\n  SKIP (엔진·비밀·mock):');
  for (const p of PASTE_SKIP_PREFIXES) console.log(`    ${p}`);
  for (const f of PASTE_SKIP_FILES) console.log(`    ${f}`);
}

function writeReportJson(report: ValidationReport) {
  const out = join(repoRoot, LOVABLE_INTAKE_ROOT, 'last-intake-report.json');
  writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`\n[intake] report → ${LOVABLE_INTAKE_ROOT}/last-intake-report.json`);
}

function printSummary(report: ValidationReport) {
  console.log('\n=== Lovable intake validation ===\n');
  console.log(`  src root:     ${relative(repoRoot, report.srcRoot)}`);
  console.log(`  files total:  ${report.totalFiles}`);
  console.log(`  src code:     ${report.codeFiles}`);
  console.log(`  skip flagged: ${report.skipCount}`);
  console.log(
    `  i18n keys:    ko=${report.i18n.koKeys} en=${report.i18n.enKeys} · sports ko=${report.i18n.koSports} en=${report.i18n.enSports}`,
  );
  console.log(`  games:        ${report.gamesPresent.join(', ') || '(none)'}`);
  if (report.pagesMissing.length) {
    console.log(`  pages missing (${report.pagesMissing.length}): ${report.pagesMissing.slice(0, 8).join(', ')}${report.pagesMissing.length > 8 ? '…' : ''}`);
  }

  if (report.secretHits.length) {
    console.error('\n  FAIL secrets:');
    for (const h of report.secretHits) console.error(`    ${h.file} (${h.pattern})`);
  } else {
    console.log('\n  secrets:      PASS (0 hits)');
  }

  const releaseCount = report.releaseHits.length;
  if (releaseCount) {
    console.warn(`\n  WARN release-scan (first ${releaseCount}):`);
    for (const h of report.releaseHits.slice(0, 15)) {
      console.warn(`    ${h.file} (${h.pattern})`);
    }
    console.warn('  → Lovable에서 제거 후 재-export 권장');
  } else {
    console.log('  release-scan: PASS (0 hits in sampled patterns)');
  }

  const fail = report.secretHits.length > 0;
  console.log(fail ? '\n  RESULT: FAIL — secrets in ZIP' : '\n  RESULT: PASS (intake ready · paste는 operator GO 후)');
  return fail ? 1 : 0;
}

function resolveIncomingZip(explicit?: string): string | undefined {
  if (explicit) return explicit;
  const incoming = join(repoRoot, LOVABLE_INTAKE_INCOMING);
  if (!existsSync(incoming)) return undefined;
  const zips = readdirSync(incoming)
    .filter((n) => n.toLowerCase().endsWith('.zip'))
    .map((n) => join(incoming, n))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  return zips[0];
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  ensureDirs();

  if (args.clean) {
    cleanStaging();
    return;
  }

  const zipPath = args.zip ?? resolveIncomingZip(undefined);
  if (zipPath) {
    console.log(`[intake] ZIP: ${zipPath}`);
    extractZip(zipPath);
  } else if (!existsSync(join(repoRoot, LOVABLE_INTAKE_STAGING))) {
    console.error(
      `[intake] No ZIP. Use --zip <path> or drop file in ${LOVABLE_INTAKE_INCOMING}/`,
    );
    process.exit(1);
  }

  let exitCode = 0;
  if (args.validate || args.plan || args.zip) {
    const report = validateStaging();
    writeReportJson(report);
    exitCode = printSummary(report);
    if (args.plan) printPlan(report);
  }

  process.exit(exitCode);
}

main();
