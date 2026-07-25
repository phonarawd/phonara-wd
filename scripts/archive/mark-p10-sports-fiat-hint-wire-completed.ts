#!/usr/bin/env node
/**
 * Mark p10-sports-fiat-hint-wire completed + sync §20.6 counts/NEXT to p10-sports-hub-pages.
 * Usage: bun run scripts/mark-p10-sports-fiat-hint-wire-completed.ts
 *
 * Run only after gate:ai-impl sports fiat hint green.
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
    /( {2}- id: p10-sports-fiat-hint-wire\r?\n {4}content: "[\s\S]*?"\r?\n {4}status: )(?:in_progress|pending)/,
    '$1completed',
  );

  text = text.replace(
    /\*\*status 실측 \(2026-07-10 · DA W5 GATE `#195` `\[x\]`\):\*\* `completed` \*\*195\*\* · `pending` \*\*76\*\* · `cancelled` \*\*7\*\*/,
    '**status 실측 (2026-07-10 · Fiat#10 `#196` `[x]`):** `completed` **196** · `pending` **75** · `cancelled` **7**',
  );
  text = text.replace(
    /\*\*현재 NEXT:\*\* `p10-sports-fiat-hint-wire` \(YAML \*\*#196\*\*\)[^\n]*/,
    '**현재 NEXT:** `p10-sports-hub-pages` (YAML **#197**) · **왕초보:** completed 스킵 · **첫 pending 1개만** · Fiat#10 `#196` `[x]` → Sports#0 hub',
  );
  text = text.replace(
    /\| \*\*completed\*\* \| \*\*195\*\* \| frontmatter `status: completed` 실측 \|/,
    '| **completed** | **196** | frontmatter `status: completed` 실측 |',
  );
  text = text.replace(
    /\| \*\*pending\*\* \| \*\*76\*\* \| 195\+76\+7=278 \|/,
    '| **pending** | **75** | 196+75+7=278 |',
  );
  text = text.replace(
    /\| \*\*NEXT\*\* \| `p10-sports-fiat-hint-wire` \| YAML \*\*#196\*\*[^\n]*/,
    '| **NEXT** | `p10-sports-hub-pages` | YAML **#197** · Fiat#10 `#196` `[x]` · Sports#0 |',
  );
  text = text.replace(
    /\*\*마지막 completed = `da-w5-gate-domain-cards`\*\* · \*\*현재 NEXT = `p10-sports-fiat-hint-wire`\*\* \(§34 DA · YAML \*\*#196\*\*\)[^\n]*/,
    '**마지막 completed = `p10-sports-fiat-hint-wire`** · **현재 NEXT = `p10-sports-hub-pages`** (§20.13.2 Fiat#10 · YAML **#197**) · **직선 큐:** Sports#0 hub→parity→live→slip→…→CasinoR→… → da-w6 → P11 → P12 → da-w8 → P13 → da-w7(strict) → T1/T2 → ew-e0 · cancelled `p2-defer-*` 7건 = YAML **맨 끝** (49차)  ',
  );

  writeFileSync(PLAN_PATH, text);
  const todos = parsePlanYamlTodos(PLAN_PATH);
  const summary = summarizePlanTodos(todos);
  const fiat = todos.find((x) => x.id === 'p10-sports-fiat-hint-wire');
  const next = todos.find((x) => x.id === 'p10-sports-hub-pages');
  console.log(
    JSON.stringify(
      {
        marked: true,
        fiat: fiat?.status,
        next: next?.status,
        summary,
      },
      null,
      2,
    ),
  );
  if (
    fiat?.status !== 'completed' ||
    next?.status !== 'pending' ||
    summary.firstPendingId !== 'p10-sports-hub-pages' ||
    summary.completed !== 196
  ) {
    console.error('FAIL post-mark', {
      fiat: fiat?.status,
      next: next?.status,
      summary,
    });
    process.exit(1);
  }
}

main();
