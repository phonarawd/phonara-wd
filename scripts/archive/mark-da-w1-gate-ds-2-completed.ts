#!/usr/bin/env node
/**
 * Mark da-w1-gate-ds-2 completed + sync §20.6 counts/NEXT to da-w2-shell-elevation-infra.
 * Usage: bun run scripts/mark-da-w1-gate-ds-2-completed.ts
 *
 * Run only after gate:ai-impl primitives+tokens · typecheck · check:i18n ·
 * check:design-tokens advisory green.
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
    /( {2}- id: da-w1-gate-ds-2\r?\n {4}content: "[\s\S]*?"\r?\n {4}status: )(?:in_progress|pending)/,
    '$1completed',
  );

  text = text.replace(
    /\*\*status 실측 \(2026-07-09 · DA W1 `\[x\]`\):\*\* `completed` \*\*186\*\* · `pending` \*\*85\*\* · `cancelled` \*\*7\*\*/,
    '**status 실측 (2026-07-09 · DA W1 GATE `[x]`):** `completed` **187** · `pending` **84** · `cancelled` **7**',
  );
  text = text.replace(
    /\*\*현재 NEXT:\*\* `da-w1-gate-ds-2` \(YAML \*\*#187\*\*\)[^\n]*/,
    '**현재 NEXT:** `da-w2-shell-elevation-infra` (YAML **#188**) · **왕초보:** completed 스킵 · **첫 pending 1개만** · DA W1 GATE `[x]` → DA W2',
  );
  text = text.replace(
    /\| \*\*completed\*\* \| \*\*186\*\* \| frontmatter `status: completed` 실측 \|/,
    '| **completed** | **187** | frontmatter `status: completed` 실측 |',
  );
  text = text.replace(
    /\| \*\*pending\*\* \| \*\*85\*\* \| 186\+85\+7=278 \|/,
    '| **pending** | **84** | 187+84+7=278 |',
  );
  text = text.replace(
    /\| \*\*NEXT\*\* \| `da-w1-gate-ds-2` \| YAML \*\*#187\*\*[^\n]*/,
    '| **NEXT** | `da-w2-shell-elevation-infra` | YAML **#188** · DA W1 GATE `[x]` · §34.10–34.11 |',
  );
  text = text.replace(
    /\*\*마지막 completed = `da-w1-ds-foundation-bundle`\*\* · \*\*현재 NEXT = `da-w1-gate-ds-2`\*\* \(§34 DA · YAML \*\*#187\*\*\) · \*\*직선 큐:\*\* da-w1-gate→w2→w3→w4→w5 →[^\n]*/,
    '**마지막 completed = `da-w1-gate-ds-2`** · **현재 NEXT = `da-w2-shell-elevation-infra`** (§34 DA · YAML **#188**) · **직선 큐:** da-w2→w3→w4→w5 → P10 잔여(Fiat#10→prematch→…→Sports#1–7→CasinoR#1→…) → da-w6 → P11 → P12 → da-w8 → P13 → da-w7(strict) → T1/T2 → ew-e0 · cancelled `p2-defer-*` 7건 = YAML **맨 끝** (49차)  ',
  );

  writeFileSync(PLAN_PATH, text);
  const todos = parsePlanYamlTodos(PLAN_PATH);
  const summary = summarizePlanTodos(todos);
  const gate = todos.find((x) => x.id === 'da-w1-gate-ds-2');
  const daw2 = todos.find((x) => x.id === 'da-w2-shell-elevation-infra');
  console.log(
    JSON.stringify(
      {
        marked: true,
        gate: gate?.status,
        daw2: daw2?.status,
        summary,
      },
      null,
      2,
    ),
  );
  if (
    gate?.status !== 'completed' ||
    daw2?.status !== 'pending' ||
    summary.firstPendingId !== 'da-w2-shell-elevation-infra' ||
    summary.completed !== 187
  ) {
    console.error('FAIL post-mark', {
      gate: gate?.status,
      daw2: daw2?.status,
      summary,
    });
    process.exit(1);
  }
}

main();
