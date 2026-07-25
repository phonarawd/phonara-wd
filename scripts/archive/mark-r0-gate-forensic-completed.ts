#!/usr/bin/env node
/**
 * Mark r0-gate-forensic-remediation completed + sync §20.6 counts/NEXT to da-w0.
 * Usage: bun run scripts/mark-r0-gate-forensic-completed.ts
 *
 * Run only after R0 #180–183 green + gate checks (plan-yaml · plan-doc-sync ·
 * phase-r-guards --strict · typecheck).
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
    /( {2}- id: r0-gate-forensic-remediation\r?\n {4}content: "[\s\S]*?"\r?\n {4}status: )(?:in_progress|pending)/,
    '$1completed',
  );

  text = text.replace(
    /\*\*status 실측 \(2026-07-09 · R0 staking SOT `\[x\]`\):\*\* `completed` \*\*183\*\* · `pending` \*\*88\*\* · `cancelled` \*\*7\*\*/,
    '**status 실측 (2026-07-09 · R0 gate `[x]`):** `completed` **184** · `pending` **87** · `cancelled` **7**',
  );
  text = text.replace(
    /\*\*현재 NEXT:\*\* `r0-gate-forensic-remediation` \(YAML \*\*#184\*\*\)[^\n]*/,
    '**현재 NEXT:** `da-w0-foundation-ssot-bundle` (YAML **#185**) · **왕초보:** completed 스킵 · **첫 pending 1개만** · R0 gate `[x]` → DA W0',
  );
  text = text.replace(
    /\| \*\*completed\*\* \| \*\*183\*\* \| frontmatter `status: completed` 실측 \|/,
    '| **completed** | **184** | frontmatter `status: completed` 실측 |',
  );
  text = text.replace(
    /\| \*\*pending\*\* \| \*\*88\*\* \| 183\+88\+7=278 \|/,
    '| **pending** | **87** | 184+87+7=278 |',
  );
  text = text.replace(
    /\| \*\*NEXT\*\* \| `r0-gate-forensic-remediation` \| YAML \*\*#184\*\*[^\n]*/,
    '| **NEXT** | `da-w0-foundation-ssot-bundle` | YAML **#185** · R0 #180–184 `[x]` · §34 DA W0 |',
  );
  text = text.replace(
    /\*\*마지막 completed = `r0-staking-domain-sot-sync`\*\* · \*\*현재 NEXT = `r0-gate-forensic-remediation`\*\* \(§35 R0 · YAML \*\*#184\*\*\) · \*\*직선 큐:\*\* R0 #184 →[^\n]*/,
    '**마지막 completed = `r0-gate-forensic-remediation`** · **현재 NEXT = `da-w0-foundation-ssot-bundle`** (§34 DA · YAML **#185**) · **직선 큐:** da-w0→w1→w2→w3→w4→w5 → P10 잔여(Fiat#10→prematch→…→Sports#1–7→CasinoR#1→…) → da-w6 → P11 → P12 → da-w8 → P13 → da-w7(strict) → T1/T2 → ew-e0 · cancelled `p2-defer-*` 7건 = YAML **맨 끝** (49차)  ',
  );
  text = text.replace(
    /\| \*\*180–184\*\* \| `r0-forensic-ssot-honesty-bundle` … `r0-gate-forensic-remediation` \(§35\) \| R0 \| #180–183 `\[x\]` · NEXT #184 R0 gate \|/,
    '| **180–184** | `r0-forensic-ssot-honesty-bundle` … `r0-gate-forensic-remediation` (§35) | R0 | #180–184 `[x]` DONE · NEXT #185 da-w0 |',
  );

  writeFileSync(PLAN_PATH, text);
  const todos = parsePlanYamlTodos(PLAN_PATH);
  const summary = summarizePlanTodos(todos);
  const gate = todos.find((x) => x.id === 'r0-gate-forensic-remediation');
  const daw0 = todos.find((x) => x.id === 'da-w0-foundation-ssot-bundle');
  console.log(
    JSON.stringify(
      {
        marked: true,
        gate: gate?.status,
        daw0: daw0?.status,
        summary,
      },
      null,
      2,
    ),
  );
  if (
    gate?.status !== 'completed' ||
    daw0?.status !== 'pending' ||
    summary.firstPendingId !== 'da-w0-foundation-ssot-bundle' ||
    summary.completed !== 184
  ) {
    console.error('FAIL post-mark', {
      gate: gate?.status,
      daw0: daw0?.status,
      summary,
    });
    process.exit(1);
  }
}

main();
