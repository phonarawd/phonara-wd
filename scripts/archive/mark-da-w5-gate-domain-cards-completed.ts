#!/usr/bin/env node
/**
 * Mark da-w5-gate-domain-cards completed + sync §20.6 counts/NEXT to p10-sports-fiat-hint-wire.
 * Usage: bun run scripts/mark-da-w5-gate-domain-cards-completed.ts
 *
 * Run only after gate:ai-impl mission-card+wallet+casino green.
 * Note: operator may forbid plan edits in a session — then skip this script and sync docs only.
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
    /( {2}- id: da-w5-gate-domain-cards\r?\n {4}content: "[\s\S]*?"\r?\n {4}status: )(?:in_progress|pending)/,
    '$1completed',
  );

  text = text.replace(
    /\*\*status 실측 \(2026-07-10 · DA W5 `#194` `\[x\]`\):\*\* `completed` \*\*194\*\* · `pending` \*\*77\*\* · `cancelled` \*\*7\*\*/,
    '**status 실측 (2026-07-10 · DA W5 GATE `#195` `[x]`):** `completed` **195** · `pending` **76** · `cancelled` **7**',
  );
  text = text.replace(
    /\*\*현재 NEXT:\*\* `da-w5-gate-domain-cards` \(YAML \*\*#195\*\*\)[^\n]*/,
    '**현재 NEXT:** `p10-sports-fiat-hint-wire` (YAML **#196**) · **왕초보:** completed 스킵 · **첫 pending 1개만** · DA W5 GATE `#195` `[x]` → P10 Fiat#10',
  );
  text = text.replace(
    /\| \*\*completed\*\* \| \*\*194\*\* \| frontmatter `status: completed` 실측 \|/,
    '| **completed** | **195** | frontmatter `status: completed` 실측 |',
  );
  text = text.replace(
    /\| \*\*pending\*\* \| \*\*77\*\* \| 194\+77\+7=278 \|/,
    '| **pending** | **76** | 195+76+7=278 |',
  );
  text = text.replace(
    /\| \*\*NEXT\*\* \| `da-w5-gate-domain-cards` \| YAML \*\*#195\*\*[^\n]*/,
    '| **NEXT** | `p10-sports-fiat-hint-wire` | YAML **#196** · DA W5 GATE `#195` `[x]` · Fiat#10 |',
  );
  text = text.replace(
    /\*\*마지막 completed = `da-w5-cards-domain-variants`\*\* · \*\*현재 NEXT = `da-w5-gate-domain-cards`\*\* \(§34 DA · YAML \*\*#195\*\*\)[^\n]*/,
    '**마지막 completed = `da-w5-gate-domain-cards`** · **현재 NEXT = `p10-sports-fiat-hint-wire`** (§34 DA · YAML **#196**) · **직선 큐:** P10(Fiat#10→prematch→…→Sports#→CasinoR#→…) → da-w6 → P11 → P12 → da-w8 → P13 → da-w7(strict) → T1/T2 → ew-e0 · cancelled `p2-defer-*` 7건 = YAML **맨 끝** (49차)  ',
  );

  writeFileSync(PLAN_PATH, text);
  const todos = parsePlanYamlTodos(PLAN_PATH);
  const summary = summarizePlanTodos(todos);
  const gate = todos.find((x) => x.id === 'da-w5-gate-domain-cards');
  const next = todos.find((x) => x.id === 'p10-sports-fiat-hint-wire');
  console.log(
    JSON.stringify(
      {
        marked: true,
        gate: gate?.status,
        next: next?.status,
        summary,
      },
      null,
      2,
    ),
  );
  if (
    gate?.status !== 'completed' ||
    next?.status !== 'pending' ||
    summary.firstPendingId !== 'p10-sports-fiat-hint-wire' ||
    summary.completed !== 195
  ) {
    console.error('FAIL post-mark', {
      gate: gate?.status,
      next: next?.status,
      summary,
    });
    process.exit(1);
  }
}

main();
