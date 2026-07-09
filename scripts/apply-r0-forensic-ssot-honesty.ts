#!/usr/bin/env node
/**
 * apply-r0-forensic-ssot-honesty.ts — §35 R0 DOC bundle closeout
 *
 * Plan body honesty residue + Apex snapshot note + repo NEXT unification.
 * Does NOT rewrite YAML todo ids (52차 merge already applied).
 *
 * Usage: bun run scripts/apply-r0-forensic-ssot-honesty.ts [--dry-run]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parsePlanYamlTodos, summarizePlanTodos } from './lib/parse-plan-yaml-todos';

const PLAN_PATH = resolve(
  process.env.USERPROFILE ?? '',
  '.cursor/plans/phase_r_super-app_8bdf2c10.plan.md',
);
const REPO_ROOT = resolve(import.meta.dirname, '..');

const EXPECTED = {
  ids: 278,
  completed: 179,
  pending: 92,
  cancelled: 7,
  trackA: 243,
  trackB: 35,
  firstPendingId: 'r0-forensic-ssot-honesty-bundle',
  firstPendingIndex: 180,
} as const;

function patchPlanBody(text: string): string {
  let out = text;

  // §20.6.1 active arithmetic residue (323 was pre-51차)
  out = out.replace(
    /\| \*\*active\*\* \| \*\*271\*\* \| 323 − 7 \|/,
    '| **active** | **271** | 278 − 7 |',
  );

  // §20.13 ladder — insert R0 row if missing; fix PQA status + NEXT footer
  if (!out.includes('| **180–184** | `r0-forensic-ssot-honesty-bundle`')) {
    out = out.replace(
      /(\| \*\*169–179\*\* \|[^\n]+\n)/,
      `$1| **180–184** | \`r0-forensic-ssot-honesty-bundle\` … \`r0-gate-forensic-remediation\` (§35) | R0 | \`[ ]\` pending · #180 = forensic SSOT |\n`,
    );
  }

  out = out.replace(
    /(\| \*\*169–179\*\* \|[^\n]*\| \*\*PQA §33\*\* \| )\*\*NEXT #170\*\* · Zero-Defect Audit · gate #179 = P10 잔여 unblock \|/,
    '$1`[x]` DONE 2026-07-09 · gate #179 = R0/P10 unblock |',
  );

  out = out.replace(
    /\*\*마지막 completed = `pqa-gate-platform-audit`\*\* · \*\*현재 NEXT = `da-w0-foundation-ssot-bundle`\*\* \(§34 DA · YAML \*\*#180\*\*\) · \*\*직선 큐:\*\* da-w0→w1→w2→w3→w4→w5 → P10 잔여/,
    '**마지막 completed = `pqa-gate-platform-audit`** · **현재 NEXT = `r0-forensic-ssot-honesty-bundle`** (§35 R0 · YAML **#180**) · **직선 큐:** R0 #180–184 → da-w0→w1→w2→w3→w4→w5 → P10 잔여',
  );

  // §33.2 — mark all PQA rows completed (C–G were stale; A/B already `[x]`)
  const pqaMark = (id: string) => {
    if (out.includes(`\`${id}\` \`[x]\``)) return;
    out = out.replace(`\`${id}\``, `\`${id}\` \`[x]\``);
  };
  for (const id of [
    'pqa-audit-c-surface-controls',
    'pqa-audit-d-config-state',
    'pqa-audit-report',
    'pqa-fix-error-mapping',
    'pqa-fix-client-gate-prechecks',
    'pqa-fix-dead-controls',
    'pqa-fix-types-regen',
    'launch-engine-e5-realtime-publication',
    'pqa-gate-platform-audit',
  ]) {
    pqaMark(id);
  }

  // §33 purpose — R0 gate-block honesty (not "P10 잔여(#180+)" alone)
  out = out.replace(
    /P10 잔여\(#180\+\)의 gate-block\./,
    'P10 잔여·DA의 gate-block · **52차 후 #180 = `r0-forensic-ssot-honesty-bundle`**(§35).',
  );

  // overview honesty — ensure Casino dual / sibling already honest (idempotent)
  out = out.replace(
    /Trade·Sports·Casino·Staking·Earn 전 surface USDT\+PHON/,
    'Trade·Sports·Staking·Earn USDT+PHON live · Casino dual=`p10-casino-replay-and-infra`',
  );
  out = out.replace(
    /\*\*sibling plan 0\*\*\(world-class_design_elevation 흡수·삭제\)/,
    '**orchestration SSOT=본 plan** · execute sibling=`trade_desk_*`·`phonara_수렴_*`(§35) · world-class_design_elevation 흡수·삭제',
  );

  return out;
}

function patchApexCloseout(text: string): string {
  if (text.includes('§35.4 Apex / Migration 정직')) return text;
  const note = `
> **§35.4 Apex / Migration 정직 (52차 · 소급 금지):** 본 문서 수치(**191**/192 · **99**/99) = **Apex CLOSEOUT 스냅샷 (2026-07-03)**.  
> **Current disk (2026-07-09):** migrations **211** · SQL tests **117** (Launch E1–E5 · Trade T0–T3 · Phase E · PQA E5 포함).  
> closeout 수치를 현재 gate로 쓰지 말 것 — 정본 표는 Plan §35.4.
`;
  return text.replace(/(상태: \*\*`\[x\] FULLY CLOSED`\*\*[^\n]*\n)/, `$1${note}`);
}

function patchRootAgents(text: string): string {
  return text.replace(
    /> \*\*Next:\*\* Phase R — \[`REBUILD_PLAN_v1\.md`\]\(docs\/PRODUCT\/REBUILD_PLAN_v1\.md\) · P1 Foundation \(Admin-first Track A\)/,
    '> **Next:** Phase R — [`REBUILD_PLAN_v1.md`](docs/PRODUCT/REBUILD_PLAN_v1.md) · **`r0-forensic-ssot-honesty-bundle`** (#180 · §35) · R0 후 `da-w0-foundation-ssot-bundle`',
  );
}

function patchActiveWorkQueue(text: string): string {
  let out = text;
  // 직선 큐: R0 구간 명시
  out = out.replace(
    /\*\*직선 큐 \(pending 구간\):\*\* … Fiat \(#158–167\) → `p10-page-sports` \(#168\) → \*\*PQA audit\+fix \(#169–179\)\*\* → P10 잔여 \(#180\+\) → P11 → P12 → P13 → T1\/T2 → Engine Wave/,
    '**직선 큐 (pending 구간):** … Fiat (#158–167) → `p10-page-sports` (#168) → **PQA (#169–179 `[x]`)** → **§35 R0 (#180–184)** → DA W0+ → P10 잔여 → P11 → P12 → P13 → T1/T2 → Engine Wave',
  );
  return out;
}

function patchCurrentStatusDaYamlNums(text: string): string {
  // da-w0 was wrongly labeled #180 (collision with r0); renumber from #185
  const map: Array<[string, number]> = [
    ['da-w0-foundation-ssot-bundle', 185],
    ['da-w1-ds-foundation-bundle', 186],
    ['da-w1-gate-ds-2', 187],
    ['da-w2-shell-elevation-infra', 188],
    ['da-w2-gate-shell-elevation', 189],
    ['da-w3-ia-progressive-bundle', 190],
    ['da-w3-gate-ia-progressive', 191],
    ['da-w4-motion-system-bundle', 192],
    ['da-w4-gate-motion', 193],
    ['da-w5-cards-domain-variants', 194],
    ['da-w5-gate-domain-cards', 195],
  ];
  let out = text;
  for (const [id, num] of map) {
    out = out.replace(
      new RegExp(`(\\| \`${id}\` \\| \`\\[ \\]\` NEXT \\| — \\| YAML #)\\d+( pending \\|)`),
      `$1${num}$2`,
    );
  }
  return out;
}

function main(): void {
  const dryRun = process.argv.includes('--dry-run');
  const todos = parsePlanYamlTodos(PLAN_PATH);
  const summary = summarizePlanTodos(todos);
  const errors: string[] = [];

  if (summary.ids !== EXPECTED.ids) errors.push(`ids=${summary.ids}`);
  if (summary.completed !== EXPECTED.completed) errors.push(`completed=${summary.completed}`);
  if (summary.pending !== EXPECTED.pending) errors.push(`pending=${summary.pending}`);
  if (summary.cancelled !== EXPECTED.cancelled) errors.push(`cancelled=${summary.cancelled}`);
  if (summary.trackA !== EXPECTED.trackA) errors.push(`trackA=${summary.trackA}`);
  if (summary.trackB !== EXPECTED.trackB) errors.push(`trackB=${summary.trackB}`);
  if (summary.firstPendingId !== EXPECTED.firstPendingId) {
    errors.push(`firstPending=${summary.firstPendingId}`);
  }
  if (summary.firstPendingIndex !== EXPECTED.firstPendingIndex) {
    errors.push(`firstPendingIndex=${summary.firstPendingIndex}`);
  }
  if (errors.length) {
    console.error(JSON.stringify({ validation: 'FAIL', errors, summary }, null, 2));
    process.exit(1);
  }

  const planRaw = readFileSync(PLAN_PATH, 'utf8');
  const planPatched = patchPlanBody(planRaw);

  const paths = {
    apex: resolve(REPO_ROOT, 'docs/ENGINE_APEX_CLOSEOUT.md'),
    agents: resolve(REPO_ROOT, 'AGENTS.md'),
    activeWork: resolve(REPO_ROOT, 'docs/SSOT/ACTIVE_WORK_SSOT.md'),
    currentStatus: resolve(REPO_ROOT, 'docs/CURRENT_STATUS.md'),
  };

  const apexPatched = patchApexCloseout(readFileSync(paths.apex, 'utf8'));
  const agentsPatched = patchRootAgents(readFileSync(paths.agents, 'utf8'));
  const activePatched = patchActiveWorkQueue(readFileSync(paths.activeWork, 'utf8'));
  const statusPatched = patchCurrentStatusDaYamlNums(readFileSync(paths.currentStatus, 'utf8'));

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          validation: 'PASS',
          summary,
          planChanged: planPatched !== planRaw,
          apexChanged: apexPatched !== readFileSync(paths.apex, 'utf8'),
        },
        null,
        2,
      ),
    );
    return;
  }

  writeFileSync(PLAN_PATH, planPatched);
  writeFileSync(paths.apex, apexPatched);
  writeFileSync(paths.agents, agentsPatched);
  writeFileSync(paths.activeWork, activePatched);
  writeFileSync(paths.currentStatus, statusPatched);

  console.log(JSON.stringify({ applied: true, validation: 'PASS', summary }, null, 2));
}

main();
