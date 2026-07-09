#!/usr/bin/env tsx
/**
 * Phase D — AI reference verification (Batch 11½).
 * Ensures gate-facing files do not treat Batch 11-deleted v2 docs as active execution SSOT.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const REPO_ROOT = process.cwd();

const GATE_ROOT_FILES = [
  '.cursorrules',
  'AGENTS.md',
  'README.md',
  'docs/DOCS_INDEX.md',
  'docs/CURRENT_STATUS.md',
  'docs/SSOT/ACTIVE_WORK_SSOT.md',
  'docs/SSOT/DEPRECATED_DOC_DENYLIST.md',
  'docs/PRODUCT/DEMOLITION_PLAN.md',
  'docs/PRODUCT/REBUILD_PLAN_v1.md',
  'apps/web/AGENTS.md',
  'apps/admin/AGENTS.md',
  'supabase/AGENTS.md',
] as const;

/** Batch 11 git rm — must not appear as live path/link in gate files */
const DELETED_DOC_PATHS = [
  'docs/SSOT/UIUX_FULL_REBUILD_EXECUTION.md',
  'docs/SSOT/MASTER_TODO.md',
  'docs/SSOT/UI_REBUILD_WAVE.md',
  'docs/SSOT/NEXT_STEP.md',
  'docs/SSOT/AI_REFERENCE_PRIORITY.md',
  'docs/SSOT/LEGACY_SURFACE_MAP.md',
  'docs/SSOT/PRESENTATION_REBUILD_SCOPE.md',
  'docs/SSOT/REBUILD_ENGINE_SSOT.md',
  'docs/SSOT/ROUTE_ENGINE_CONTRACT.md',
  'docs/SSOT/DESIGN_SYSTEM_V2.md',
  'docs/SSOT/DECISION_LOG.md',
  'docs/analysis/',
] as const;

/** Engine Apex evidence — git archive only; not implementation queue */
const FROZEN_ENGINE_EVIDENCE_PREFIXES = [
  'docs/ENGINE_PHASE',
  'docs/ENGINE_POST_APEX',
  'docs/ENGINE_FORENSIC',
  'docs/ENGINE_STATE_AUDIT',
  'docs/ENGINE_CLOSED_BETA',
  'docs/ENGINE_FINAL_FUNDING',
] as const;

const FROZEN_ENGINE_TOKENS = [
  'ENGINE_PHASE0_EVIDENCE',
  'ENGINE_PHASE2_DB',
  'ENGINE_PHASE25',
  'ENGINE_PHASE3_PACKAGE',
  'ENGINE_PHASE4_CASINO',
  'ENGINE_PHASE5_SPORTSBOOK',
  'ENGINE_PHASE6',
  'ENGINE_PHASE8',
  'ENGINE_POST_APEX',
  'ENGINE_FORENSIC_AUDIT',
  'ENGINE_STATE_AUDIT',
  'p0-foundation',
  'p6-final-gates',
  'post-apex-p1-p2',
] as const;

const LEGACY_TOKENS = [
  'PHONARA_ACTIVE_ROADMAP',
  'MASTER_EXECUTION_PROMPT',
  'PHONARA_DESIGN_CANON',
  'DESIGN_CANON_40',
  'R3-agent-handoff',
] as const;

const V2_EXECUTION_TOKENS = [
  'UIUX_FULL_REBUILD_EXECUTION',
  'UI_REBUILD_WAVE',
  'MASTER_TODO',
  'AI_REFERENCE_PRIORITY',
] as const;

const MOCKUP_UI_PATH_TOKENS = ['design-source', 'visual-diagnosis'] as const;

const MOCKUP_PACKAGE_SCRIPTS = [
  'pretest:e2e:m0-pivot',
  'test:e2e:m0-pivot',
  'posttest:e2e:m0-pivot',
  'check:m0-pivot-gates',
  'rebuild:c1-assets',
  'rebuild:r1-mockups',
  'visual:login-gap-diagnose',
] as const;

const ACTIVE_POISON =
  /다음 작업 정본|리빌드 명령 정본|디자인 정본|Always read.*PHONARA_ACTIVE|single active tactical|live tracker.*rebuild|rebuild\/NEXT_STEP.*live|active 큐(?!.*아님)|active queue(?!.*deprecated)|Live tracker.*NEXT_STEP(?!.*superseded)|다음 1건.*u[0-9]-(?!.*plan v2)|U-wave todo.*정본(?!.*plan)/i;

const DEPRECATED_CONTEXT =
  /deprecated|아카이브|archive|참고·이력|참고만|실행 큐 아님|실행 금지|실행 정본 아님|history only|do not follow|not execution|superseded|do not use for|never follow|following deprecated|legacy mockup|pixel advisory|forbidden|fail\s*=|do not treat|deprecated for|참고\/이력|글지 말|참고\)|아카이브\)|active 주장|active 큐 아님|P6 delete candidate|v2 plan|plan v2|UIUX_FULL_REBUILD|DEPRECATED_DOC_DENYLIST|증거·이력|superseded by plan|inventory only|폐기 inventory|read-only audit|evidence only|Batch 11|git rm|Phase D|Demolition|삭제된|deleted v2|never restore|적용 안 함|Do not read as execution/i;

const REBUILD_ACTIVE_QUEUE =
  /rebuild\/NEXT_STEP.*(live|일일 큐|필독|정본)|RELEASE_ROADMAP.*live tracker(?!.*deprecated)/i;

/** Files that inventory Batch 11 deletes — listing paths here is required, not an active reference */
const DENYLIST_CATALOG_FILES = new Set([
  'docs/SSOT/DEPRECATED_DOC_DENYLIST.md',
  'docs/SSOT/ACTIVE_WORK_SSOT.md',
  'docs/ENGINE_APEX_CLOSEOUT.md',
  'docs/PRODUCT/DEMOLITION_PLAN.md',
  '.cursor/rules/00-phase-d-demolition.mdc',
  '.cursor/rules/00-post-closeout-active-ssot.mdc',
  '.cursor/rules/00-core.mdc',
  '.cursor/rules/93-uiux-full-rebuild-v2-execution.mdc',
  '.cursor/rules/82-work-doc-closeout-sync.mdc',
]);

type Violation = { file: string; line: number; message: string };

function collectMdcFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) continue;
    if (entry.endsWith('.mdc')) out.push(path.replaceAll('\\', '/'));
  }
  return out;
}

function gateFiles(): string[] {
  const rulesDir = join(REPO_ROOT, '.cursor/rules');
  const mdc = collectMdcFiles(rulesDir).map((p) => relative(REPO_ROOT, p).replaceAll('\\', '/'));
  return [...GATE_ROOT_FILES, ...mdc];
}

function readLines(relPath: string): string[] {
  const abs = join(REPO_ROOT, relPath);
  return readFileSync(abs, 'utf8').split(/\r?\n/);
}

function lineContext(lines: string[], index: number): string {
  const prev = index > 0 ? (lines[index - 1] ?? '') : '';
  return `${prev}\n${lines[index] ?? ''}`;
}

function hasDeprecatedContext(line: string, context: string): boolean {
  return DEPRECATED_CONTEXT.test(line) || DEPRECATED_CONTEXT.test(context);
}

function isMockupProhibition(line: string): boolean {
  return /do not|must not|forbidden|금지|demoted|advisory|not treat|never treat|not primary|Do not treat|External PNG|mockup fixture|pixel baseline diff/i.test(
    line,
  );
}

function isActiveLegacyLine(line: string, context: string, token: string): boolean {
  if (!line.includes(token)) return false;
  if (hasDeprecatedContext(line, context)) return false;
  if (ACTIVE_POISON.test(line) || ACTIVE_POISON.test(context)) return true;
  return true;
}

function scanGateFile(relPath: string): Violation[] {
  if (DENYLIST_CATALOG_FILES.has(relPath)) return [];

  const lines = readLines(relPath);
  const out: Violation[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const context = lineContext(lines, i);
    const lineNo = i + 1;

    for (const path of DELETED_DOC_PATHS) {
      if (!line.includes(path)) continue;
      if (hasDeprecatedContext(line, context)) continue;
      out.push({
        file: relPath,
        line: lineNo,
        message: `Deleted doc path "${path}" referenced as active — Batch 11 denylist`,
      });
    }

    for (const prefix of FROZEN_ENGINE_EVIDENCE_PREFIXES) {
      if (!line.includes(prefix)) continue;
      if (hasDeprecatedContext(line, context)) continue;
      if (/denylist|Frozen|cursorignore|감사 이력|구현 큐 금지/i.test(line)) continue;
      out.push({
        file: relPath,
        line: lineNo,
        message: `Frozen engine evidence "${prefix}*" referenced as active — use ENGINE_APEX_CLOSEOUT status only`,
      });
    }

    for (const token of FROZEN_ENGINE_TOKENS) {
      if (!line.includes(token)) continue;
      if (hasDeprecatedContext(line, context)) continue;
      if (/denylist|Frozen|재착수 금지|FULLY CLOSED|구현 큐 0/i.test(line)) continue;
      out.push({
        file: relPath,
        line: lineNo,
        message: `Frozen engine token "${token}" without deprecated context — Engine Apex closed`,
      });
    }

    for (const token of LEGACY_TOKENS) {
      if (isActiveLegacyLine(line, context, token)) {
        out.push({
          file: relPath,
          line: lineNo,
          message: `Active legacy token "${token}" — use DEMOLITION_PLAN or mark deprecated only`,
        });
      }
    }

    for (const token of V2_EXECUTION_TOKENS) {
      if (!line.includes(token)) continue;
      if (hasDeprecatedContext(line, context)) continue;
      if (/never restore|Do not read|적용 안 함|deleted|Batch 11|git rm/i.test(line)) continue;
      out.push({
        file: relPath,
        line: lineNo,
        message: `V2 execution token "${token}" without deprecated context — Batch 11 deleted`,
      });
    }

    if (
      /NEXT_STEP\.md|NEXT_STEP`/i.test(line) &&
      !hasDeprecatedContext(line, context) &&
      !/DEMOLITION_PLAN|Phase D|LOWSPEC|rebuild\/PHASE/i.test(line)
    ) {
      out.push({
        file: relPath,
        line: lineNo,
        message: 'docs/SSOT/NEXT_STEP.md referenced — Batch 11 deleted; use DEMOLITION_PLAN',
      });
    }

    if (REBUILD_ACTIVE_QUEUE.test(line) && !hasDeprecatedContext(line, context)) {
      out.push({
        file: relPath,
        line: lineNo,
        message: 'docs/rebuild/ or RELEASE_ROADMAP referenced as live execution queue',
      });
    }

    for (const token of MOCKUP_UI_PATH_TOKENS) {
      if (!line.includes(token)) continue;
      if (hasDeprecatedContext(line, context)) continue;
      if (/삭제|delete|do not use|금지|deprecated|아카이브|preserve note/i.test(line)) continue;
      out.push({
        file: relPath,
        line: lineNo,
        message: `Mockup UI path "${token}" referenced as execution baseline — SSOT UX canon only`,
      });
    }

    if (
      /mockup/i.test(line) &&
      !hasDeprecatedContext(line, context) &&
      !isMockupProhibition(line)
    ) {
      const uiBaseline =
        /design-source|visual-diagnosis|pixelmatch|pixel diff|mockup PNG|목업 PNG|R##|정본 PNG|tests\/visual\/mockups/i.test(
          line,
        );
      if (uiBaseline) {
        out.push({
          file: relPath,
          line: lineNo,
          message: 'Mockup/pixel baseline referenced for UI execution — forbidden in gate files',
        });
      }
    }
  }

  return out;
}

function scanPackageScripts(): Violation[] {
  const pkgPath = join(REPO_ROOT, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { scripts?: Record<string, string> };
  const scripts = pkg.scripts ?? {};
  const out: Violation[] = [];

  for (const name of MOCKUP_PACKAGE_SCRIPTS) {
    if (name in scripts) {
      out.push({
        file: 'package.json',
        line: 0,
        message: `Mockup/M0 package script still registered: "${name}" (remove before P6 or now for P5 green)`,
      });
    }
  }

  return out;
}

function main(): void {
  const violations: Violation[] = [];

  for (const file of gateFiles()) {
    try {
      violations.push(...scanGateFile(file));
    } catch (err) {
      violations.push({
        file,
        line: 0,
        message: `Unreadable gate file: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  violations.push(...scanPackageScripts());

  if (violations.length > 0) {
    process.stderr.write('check:ai-reference FAIL\n');
    for (const v of violations) {
      const loc = v.line > 0 ? `${v.file}:${v.line}` : v.file;
      process.stderr.write(`  ${loc} — ${v.message}\n`);
    }
    process.exit(1);
  }

  process.stdout.write(
    [
      'check:ai-reference OK',
      `- gate files scanned: ${gateFiles().length}`,
      '- Batch 11 deleted doc paths: 0 active in gate files',
      '- frozen engine evidence refs: 0 active in gate files',
      '- legacy execution tokens: 0 active (deprecated context only)',
      '- mockup/design-source/visual-diagnosis UI baseline refs: 0',
      `- package.json mockup scripts: 0/${MOCKUP_PACKAGE_SCRIPTS.length}`,
    ].join('\n') + '\n',
  );
}

main();
