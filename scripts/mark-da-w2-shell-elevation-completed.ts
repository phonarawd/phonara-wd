#!/usr/bin/env node
/**
 * Mark da-w2-shell-elevation-infra completed + sync §20.6 counts/NEXT to da-w2-gate-shell-elevation.
 * Usage: bun run scripts/mark-da-w2-shell-elevation-completed.ts
 *
 * Run only after gate:ai-impl shell+tokens · typecheck · check:design-tokens advisory green.
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
    /( {2}- id: da-w2-shell-elevation-infra\r?\n {4}content: "[\s\S]*?"\r?\n {4}status: )(?:in_progress|pending)/,
    '$1completed',
  );

  text = text.replace(
    /\*\*status 실측 \(2026-07-09 · DA W1 GATE `\[x\]`\):\*\* `completed` \*\*187\*\* · `pending` \*\*84\*\* · `cancelled` \*\*7\*\*/,
    '**status 실측 (2026-07-09 · DA W2 `[x]`):** `completed` **188** · `pending` **83** · `cancelled` **7**',
  );
  text = text.replace(
    /\*\*현재 NEXT:\*\* `da-w2-shell-elevation-infra` \(YAML \*\*#188\*\*\)[^\n]*/,
    '**현재 NEXT:** `da-w2-gate-shell-elevation` (YAML **#189**) · **왕초보:** completed 스킵 · **첫 pending 1개만** · DA W2 `[x]` → W2 GATE',
  );
  text = text.replace(
    /\| \*\*completed\*\* \| \*\*187\*\* \| frontmatter `status: completed` 실측 \|/,
    '| **completed** | **188** | frontmatter `status: completed` 실측 |',
  );
  text = text.replace(
    /\| \*\*pending\*\* \| \*\*84\*\* \| 187\+84\+7=278 \|/,
    '| **pending** | **83** | 188+83+7=278 |',
  );
  text = text.replace(
    /\| \*\*NEXT\*\* \| `da-w2-shell-elevation-infra` \| YAML \*\*#188\*\*[^\n]*/,
    '| **NEXT** | `da-w2-gate-shell-elevation` | YAML **#189** · DA W2 `[x]` · §34.10–34.11 GATE |',
  );
  text = text.replace(
    /\*\*마지막 completed = `da-w1-gate-ds-2`\*\* · \*\*현재 NEXT = `da-w2-shell-elevation-infra`\*\* \(§34 DA · YAML \*\*#188\*\*\) · \*\*직선 큐:\*\* da-w2→w3→w4→w5 →[^\n]*/,
    '**마지막 completed = `da-w2-shell-elevation-infra`** · **현재 NEXT = `da-w2-gate-shell-elevation`** (§34 DA · YAML **#189**) · **직선 큐:** da-w2-gate→w3→w4→w5 → P10 잔여(Fiat#10→prematch→…→Sports#1–7→CasinoR#1→…) → da-w6 → P11 → P12 → da-w8 → P13 → da-w7(strict) → T1/T2 → ew-e0 · cancelled `p2-defer-*` 7건 = YAML **맨 끝** (49차)  ',
  );

  writeFileSync(PLAN_PATH, text);
  const todos = parsePlanYamlTodos(PLAN_PATH);
  const summary = summarizePlanTodos(todos);
  const daw2 = todos.find((x) => x.id === 'da-w2-shell-elevation-infra');
  const gate = todos.find((x) => x.id === 'da-w2-gate-shell-elevation');
  console.log(
    JSON.stringify(
      {
        marked: true,
        daw2: daw2?.status,
        gate: gate?.status,
        summary,
      },
      null,
      2,
    ),
  );
  if (
    daw2?.status !== 'completed' ||
    gate?.status !== 'pending' ||
    summary.firstPendingId !== 'da-w2-gate-shell-elevation' ||
    summary.completed !== 188
  ) {
    console.error('FAIL post-mark', {
      daw2: daw2?.status,
      gate: gate?.status,
      summary,
    });
    process.exit(1);
  }
}

main();
