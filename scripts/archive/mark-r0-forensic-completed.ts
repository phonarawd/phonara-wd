#!/usr/bin/env node
/**
 * Mark r0-forensic-ssot-honesty-bundle completed + sync §20.6 counts/NEXT to #181.
 * Usage: bun run scripts/mark-r0-forensic-completed.ts
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
  const re =
    /( {2}- id: r0-forensic-ssot-honesty-bundle\r?\n {4}content: "[\s\S]*?"\r?\n {4}status: )(?:in_progress|pending)/;
  if (!re.test(text)) {
    const todos = parsePlanYamlTodos(PLAN_PATH);
    const t = todos.find((x) => x.id === 'r0-forensic-ssot-honesty-bundle');
    if (t?.status === 'completed') {
      console.log(JSON.stringify({ already: true, summary: summarizePlanTodos(todos) }, null, 2));
      return;
    }
    console.error('FAIL: r0-forensic status block not found');
    process.exit(1);
  }
  text = text.replace(re, '$1completed');

  // After complete: first pending = r0-sports (#181) · completed 180 · pending 91
  text = text.replace(
    /\*\*status 실측 \(2026-07-09 · 52차 forensic sync\):\*\* `completed` \*\*179\*\* · `pending` \*\*92\*\* \(\+5 r0-\*\) · `cancelled` \*\*7\*\*/,
    '**status 실측 (2026-07-09 · R0 forensic DOC `[x]`):** `completed` **180** · `pending` **91** · `cancelled` **7**',
  );
  text = text.replace(
    /\*\*현재 NEXT:\*\* `r0-forensic-ssot-honesty-bundle` \(YAML \*\*#180\*\*\)[^\n]*/,
    '**현재 NEXT:** `r0-sports-launch-gate-wire` (YAML **#181**) · **왕초보:** completed 스킵 · **첫 pending 1개만** · R0 DOC `[x]` → sports launch gate',
  );
  text = text.replace(
    /\| \*\*completed\*\* \| \*\*179\*\* \| frontmatter `status: completed` 실측 \|/,
    '| **completed** | **180** | frontmatter `status: completed` 실측 |',
  );
  text = text.replace(
    /\| \*\*pending\*\* \| \*\*92\*\* \| 179\+92\+7=278 \|/,
    '| **pending** | **91** | 180+91+7=278 |',
  );
  text = text.replace(
    /\| \*\*NEXT\*\* \| `r0-forensic-ssot-honesty-bundle` \| YAML \*\*#180\*\*[^\n]*/,
    '| **NEXT** | `r0-sports-launch-gate-wire` | YAML **#181** · R0 DOC `[x]` · Fiat#9G `[x]` · PQA `[x]` |',
  );
  text = text.replace(
    /\*\*마지막 completed = `pqa-gate-platform-audit`\*\* · \*\*현재 NEXT = `r0-forensic-ssot-honesty-bundle`\*\* \(§35 R0 · YAML \*\*#180\*\*\) · \*\*직선 큐:\*\* R0 #180–184 →/,
    '**마지막 completed = `r0-forensic-ssot-honesty-bundle`** · **현재 NEXT = `r0-sports-launch-gate-wire`** (§35 R0 · YAML **#181**) · **직선 큐:** R0 #181–184 →',
  );
  text = text.replace(
    /\| \*\*180–184\*\* \| `r0-forensic-ssot-honesty-bundle` … `r0-gate-forensic-remediation` \(§35\) \| R0 \| `\[ \]` pending · #180 = forensic SSOT \|/,
    '| **180–184** | `r0-forensic-ssot-honesty-bundle` … `r0-gate-forensic-remediation` (§35) | R0 | #180 `[x]` · NEXT #181 sports launch |',
  );
  // §33.2 G row
  text = text.replace(
    /\| G \| `pqa-gate-platform-audit` \| 전건 green \+ 82 sync \| P10 잔여 unblock \|/,
    '| G | `pqa-gate-platform-audit` `[x]` | 전건 green + 82 sync | P10/R0 unblock |',
  );

  writeFileSync(PLAN_PATH, text);
  const todos = parsePlanYamlTodos(PLAN_PATH);
  const summary = summarizePlanTodos(todos);
  console.log(JSON.stringify({ marked: true, summary }, null, 2));
  if (summary.firstPendingId !== 'r0-sports-launch-gate-wire' || summary.completed !== 180) {
    console.error('FAIL post-mark summary', summary);
    process.exit(1);
  }
}

main();
