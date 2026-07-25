#!/usr/bin/env node
/**
 * Mark r0-staking-domain-sot-sync completed + sync §20.6 counts/NEXT to #184.
 * Usage: bun run scripts/mark-r0-staking-domain-completed.ts
 *
 * Operator/agent may run this after INFRA code lands — does not invent surface work.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parsePlanYamlTodos, summarizePlanTodos } from './lib/parse-plan-yaml-todos';

const PLAN_PATH = resolve(
  process.env.USERPROFILE ?? '',
  '.cursor/plans/phase_r_super-app_8bdf2c10.plan.md',
);

function main(): void {
  let text = readFileSync(PLAN_PATH, 'utf8');

  text = text.replace(
    /( {2}- id: r0-staking-domain-sot-sync\r?\n {4}content: "[\s\S]*?"\r?\n {4}status: )(?:in_progress|pending)/,
    '$1completed',
  );

  text = text.replace(
    /\*\*status 실측 \(2026-07-09 · R0 admin RBAC `\[x\]`\):\*\* `completed` \*\*182\*\* · `pending` \*\*89\*\* · `cancelled` \*\*7\*\*/,
    '**status 실측 (2026-07-09 · R0 staking SOT `[x]`):** `completed` **183** · `pending` **88** · `cancelled` **7**',
  );
  text = text.replace(
    /\*\*현재 NEXT:\*\* `r0-staking-domain-sot-sync` \(YAML \*\*#183\*\*\)[^\n]*/,
    '**현재 NEXT:** `r0-gate-forensic-remediation` (YAML **#184**) · **왕초보:** completed 스킵 · **첫 pending 1개만** · staking SOT `[x]` → R0 gate',
  );
  text = text.replace(
    /\| \*\*completed\*\* \| \*\*182\*\* \| frontmatter `status: completed` 실측 \|/,
    '| **completed** | **183** | frontmatter `status: completed` 실측 |',
  );
  text = text.replace(
    /\| \*\*pending\*\* \| \*\*89\*\* \| 182\+89\+7=278 \|/,
    '| **pending** | **88** | 183+88+7=278 |',
  );
  text = text.replace(
    /\| \*\*NEXT\*\* \| `r0-staking-domain-sot-sync` \| YAML \*\*#183\*\*[^\n]*/,
    '| **NEXT** | `r0-gate-forensic-remediation` | YAML **#184** · staking SOT `[x]` · admin RBAC `[x]` · sports launch `[x]` · R0 DOC `[x]` |',
  );
  text = text.replace(
    /\*\*마지막 completed = `r0-admin-rbac-ops-wire`\*\* · \*\*현재 NEXT = `r0-staking-domain-sot-sync`\*\* \(§35 R0 · YAML \*\*#183\*\*\) · \*\*직선 큐:\*\* R0 #[^\n]*/,
    '**마지막 completed = `r0-staking-domain-sot-sync`** · **현재 NEXT = `r0-gate-forensic-remediation`** (§35 R0 · YAML **#184**) · **직선 큐:** R0 #184 → da-w0→w1→w2→w3→w4→w5 → P10 잔여(Fiat#10→prematch→…→Sports#1–7→CasinoR#1→…) → da-w6 → P11 → P12 → da-w8 → P13 → da-w7(strict) → T1/T2 → ew-e0 · cancelled `p2-defer-*` 7건 = YAML **맨 끝** (49차)  ',
  );
  text = text.replace(
    /\| \*\*180–184\*\* \| `r0-forensic-ssot-honesty-bundle` … `r0-gate-forensic-remediation` \(§35\) \| R0 \| #180–182 `\[x\]` · NEXT #183 staking SOT \|/,
    '| **180–184** | `r0-forensic-ssot-honesty-bundle` … `r0-gate-forensic-remediation` (§35) | R0 | #180–183 `[x]` · NEXT #184 R0 gate |',
  );

  writeFileSync(PLAN_PATH, text);
  const todos = parsePlanYamlTodos(PLAN_PATH);
  const summary = summarizePlanTodos(todos);
  const staking = todos.find((x) => x.id === 'r0-staking-domain-sot-sync');
  const gate = todos.find((x) => x.id === 'r0-gate-forensic-remediation');
  console.log(
    JSON.stringify(
      {
        marked: true,
        staking: staking?.status,
        gate: gate?.status,
        summary,
      },
      null,
      2,
    ),
  );
  if (
    staking?.status !== 'completed' ||
    gate?.status !== 'pending' ||
    summary.firstPendingId !== 'r0-gate-forensic-remediation' ||
    summary.completed !== 183
  ) {
    console.error('FAIL post-mark', {
      staking: staking?.status,
      gate: gate?.status,
      summary,
    });
    process.exit(1);
  }
}

main();
