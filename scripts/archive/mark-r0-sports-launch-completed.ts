#!/usr/bin/env node
/**
 * Mark r0-sports-launch-gate-wire completed + reopen false-completed R0 wires
 * that have no product implementation yet + sync §20.6 counts/NEXT to #182.
 * Usage: bun run scripts/mark-r0-sports-launch-completed.ts
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parsePlanYamlTodos, summarizePlanTodos } from './lib/parse-plan-yaml-todos';

const PLAN_PATH = resolve(
  process.env.USERPROFILE ?? '',
  '.cursor/plans/phase_r_super-app_8bdf2c10.plan.md',
);

/** R0 ids that must stay pending until their wire/infra is actually shipped. */
const REOPEN_IF_COMPLETED = ['r0-admin-rbac-ops-wire', 'r0-staking-domain-sot-sync'] as const;

function main(): void {
  let text = readFileSync(PLAN_PATH, 'utf8');

  text = text.replace(
    /( {2}- id: r0-sports-launch-gate-wire\r?\n {4}content: "[\s\S]*?"\r?\n {4}status: )(?:in_progress|pending)/,
    '$1completed',
  );

  for (const id of REOPEN_IF_COMPLETED) {
    const re = new RegExp(
      `( {2}- id: ${id}\\r?\\n {4}content: "[\\s\\S]*?"\\r?\\n {4}status: )completed`,
    );
    text = text.replace(re, '$1pending');
  }

  text = text.replace(
    /\*\*status 실측 \(2026-07-09 · R0 (?:forensic DOC|sports launch) `\[x\]`\):\*\* `completed` \*\*\d+\*\* · `pending` \*\*\d+\*\* · `cancelled` \*\*7\*\*/,
    '**status 실측 (2026-07-09 · R0 sports launch `[x]`):** `completed` **181** · `pending` **90** · `cancelled` **7**',
  );
  text = text.replace(
    /\*\*현재 NEXT:\*\* `r0-[a-z0-9-]+` \(YAML \*\*#\d+\*\*\)[^\n]*/,
    '**현재 NEXT:** `r0-admin-rbac-ops-wire` (YAML **#182**) · **왕초보:** completed 스킵 · **첫 pending 1개만** · sports launch gate `[x]` → admin RBAC',
  );
  text = text.replace(
    /\| \*\*completed\*\* \| \*\*\d+\*\* \| frontmatter `status: completed` 실측 \|/,
    '| **completed** | **181** | frontmatter `status: completed` 실측 |',
  );
  text = text.replace(
    /\| \*\*pending\*\* \| \*\*\d+\*\* \| \d+\+\d+\+7=278 \|/,
    '| **pending** | **90** | 181+90+7=278 |',
  );
  text = text.replace(
    /\| \*\*NEXT\*\* \| `r0-[a-z0-9-]+` \| YAML \*\*#\d+\*\*[^\n]*/,
    '| **NEXT** | `r0-admin-rbac-ops-wire` | YAML **#182** · sports launch `[x]` · R0 DOC `[x]` · PQA `[x]` |',
  );
  text = text.replace(
    /\*\*마지막 completed = `r0-[a-z0-9-]+`\*\* · \*\*현재 NEXT = `r0-[a-z0-9-]+`\*\* \(§35 R0 · YAML \*\*#\d+\*\*\) · \*\*직선 큐:\*\* R0 #[^\n]*/,
    '**마지막 completed = `r0-sports-launch-gate-wire`** · **현재 NEXT = `r0-admin-rbac-ops-wire`** (§35 R0 · YAML **#182**) · **직선 큐:** R0 #182–184 → da-w0→w1→w2→w3→w4→w5 → P10 잔여(Fiat#10→prematch→…→Sports#1–7→CasinoR#1→…) → da-w6 → P11 → P12 → da-w8 → P13 → da-w7(strict) → T1/T2 → ew-e0 · cancelled `p2-defer-*` 7건 = YAML **맨 끝** (49차)  ',
  );
  text = text.replace(
    /\| \*\*180–184\*\* \| `r0-forensic-ssot-honesty-bundle` … `r0-gate-forensic-remediation` \(§35\) \| R0 \|[^\n]*/,
    '| **180–184** | `r0-forensic-ssot-honesty-bundle` … `r0-gate-forensic-remediation` (§35) | R0 | #180–181 `[x]` · NEXT #182 admin RBAC |',
  );

  writeFileSync(PLAN_PATH, text);
  const todos = parsePlanYamlTodos(PLAN_PATH);
  const summary = summarizePlanTodos(todos);
  const sports = todos.find((x) => x.id === 'r0-sports-launch-gate-wire');
  const admin = todos.find((x) => x.id === 'r0-admin-rbac-ops-wire');
  const staking = todos.find((x) => x.id === 'r0-staking-domain-sot-sync');
  console.log(
    JSON.stringify(
      {
        marked: true,
        sports: sports?.status,
        admin: admin?.status,
        staking: staking?.status,
        summary,
      },
      null,
      2,
    ),
  );
  if (
    sports?.status !== 'completed' ||
    admin?.status !== 'pending' ||
    staking?.status !== 'pending' ||
    summary.firstPendingId !== 'r0-admin-rbac-ops-wire' ||
    summary.completed !== 181
  ) {
    console.error('FAIL post-mark', {
      sports: sports?.status,
      admin: admin?.status,
      staking: staking?.status,
      summary,
    });
    process.exit(1);
  }
}

main();
