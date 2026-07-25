#!/usr/bin/env node
/**
 * Mark da-w5-cards-domain-variants completed + sync §20.6 counts/NEXT to da-w5-gate-domain-cards.
 * Usage: bun run scripts/mark-da-w5-cards-domain-variants-completed.ts
 *
 * Run only after gate:ai-impl domain-card CVA+wires green.
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
    /( {2}- id: da-w5-cards-domain-variants\r?\n {4}content: "[\s\S]*?"\r?\n {4}status: )(?:in_progress|pending)/,
    '$1completed',
  );

  text = text.replace(
    /\*\*status 실측 \(2026-07-09 · DA W2 `\[x\]`\):\*\* `completed` \*\*190\*\* · `pending` \*\*81\*\* · `cancelled` \*\*7\*\*/,
    '**status 실측 (2026-07-10 · DA W5 `#194` `[x]`):** `completed` **194** · `pending` **77** · `cancelled` **7**',
  );
  text = text.replace(
    /\*\*현재 NEXT:\*\* `da-w3-gate-ia-progressive` \(YAML \*\*#191\*\*\)[^\n]*/,
    '**현재 NEXT:** `da-w5-gate-domain-cards` (YAML **#195**) · **왕초보:** completed 스킵 · **첫 pending 1개만** · DA W5 `#194` `[x]` → W5 GATE',
  );
  text = text.replace(
    /\| \*\*completed\*\* \| \*\*190\*\* \| frontmatter `status: completed` 실측 \|/,
    '| **completed** | **194** | frontmatter `status: completed` 실측 |',
  );
  text = text.replace(
    /\| \*\*pending\*\* \| \*\*81\*\* \| 190\+81\+7=278 \|/,
    '| **pending** | **77** | 194+77+7=278 |',
  );
  text = text.replace(
    /\| \*\*NEXT\*\* \| `da-w3-gate-ia-progressive` \| YAML \*\*#191\*\*[^\n]*/,
    '| **NEXT** | `da-w5-gate-domain-cards` | YAML **#195** · DA W5 `#194` `[x]` · §34.17 GATE |',
  );
  text = text.replace(
    /\*\*마지막 completed = `da-w2-gate-shell-elevation`\*\* · \*\*현재 NEXT = `da-w3-ia-progressive-bundle`\*\* \(§34 DA · YAML \*\*#189\*\*\)[^\n]*/,
    '**마지막 completed = `da-w5-cards-domain-variants`** · **현재 NEXT = `da-w5-gate-domain-cards`** (§34 DA · YAML **#195**) · **직선 큐:** da-w5-gate→P10(Fiat#10→prematch→…→Sports#→CasinoR#→…) → da-w6 → P11 → P12 → da-w8 → P13 → da-w7(strict) → T1/T2 → ew-e0 · cancelled `p2-defer-*` 7건 = YAML **맨 끝** (49차)  ',
  );

  writeFileSync(PLAN_PATH, text);
  const todos = parsePlanYamlTodos(PLAN_PATH);
  const summary = summarizePlanTodos(todos);
  const w5 = todos.find((x) => x.id === 'da-w5-cards-domain-variants');
  const gate = todos.find((x) => x.id === 'da-w5-gate-domain-cards');
  console.log(
    JSON.stringify(
      {
        marked: true,
        w5: w5?.status,
        gate: gate?.status,
        summary,
      },
      null,
      2,
    ),
  );
  if (
    w5?.status !== 'completed' ||
    gate?.status !== 'pending' ||
    summary.firstPendingId !== 'da-w5-gate-domain-cards' ||
    summary.completed !== 194
  ) {
    console.error('FAIL post-mark', {
      w5: w5?.status,
      gate: gate?.status,
      summary,
    });
    process.exit(1);
  }
}

main();
