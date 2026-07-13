#!/usr/bin/env node
/**
 * Mark p10-page-casino completed + sync §20.6 NEXT to p10-casino-replay-and-infra.
 * Usage: bun run scripts/mark-p10-page-casino-completed.ts
 *
 * Run only after gate:ai-impl casino lobby green.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parsePlanYamlTodos, summarizePlanTodos } from './lib/parse-plan-yaml-todos';

const PLAN_PATH = resolve(
  process.env['USERPROFILE'] ?? '',
  '.cursor/plans/phase_r_super-app_8bdf2c10.plan.md',
);

function main(): void {
  let text = readFileSync(PLAN_PATH, 'utf8');

  text = text.replace(
    /( {2}- id: p10-page-casino\r?\n {4}content: "[\s\S]*?"\r?\n {4}status: )(?:in_progress|pending)/,
    '$1completed',
  );

  // Drift guard: replay bundle is NEXT — must stay pending until implemented.
  text = text.replace(
    /( {2}- id: p10-casino-replay-and-infra\r?\n {4}content: "[\s\S]*?"\r?\n {4}status: )completed/,
    '$1pending',
  );

  // Drift guard: fiat hint lock follows replay — not done with lobby alone.
  text = text.replace(
    /( {2}- id: p10-casino-fiat-hint-session-lock\r?\n {4}content: "[\s\S]*?"\r?\n {4}status: )completed/,
    '$1pending',
  );

  text = text.replace(
    /\*\*status 실측 \(2026-07-10 · Sports#4 `#202` `\[x\]`\):\*\* `completed` \*\*202\*\* · `pending` \*\*69\*\* · `cancelled` \*\*7\*\*/,
    '**status 실측 (2026-07-10 · Casino lobby `#203` `[x]`):** `completed` **203** · `pending` **68** · `cancelled` **7**',
  );
  text = text.replace(
    /\*\*현재 NEXT:\*\* `p10-page-casino` \(YAML \*\*#203\*\*\)[^\n]*/,
    '**현재 NEXT:** `p10-casino-replay-and-infra` (YAML **#204**) · **왕초보:** completed 스킵 · **첫 pending 1개만** · Casino lobby `#203` `[x]` → CasinoR#1',
  );
  text = text.replace(
    /\| \*\*completed\*\* \| \*\*202\*\* \| frontmatter `status: completed` 실측 \|/,
    '| **completed** | **203** | frontmatter `status: completed` 실측 |',
  );
  text = text.replace(
    /\| \*\*pending\*\* \| \*\*69\*\* \| 202\+69\+7=278 \|/,
    '| **pending** | **68** | 203+68+7=278 |',
  );
  text = text.replace(
    /\| \*\*NEXT\*\* \| `p10-page-casino` \| YAML \*\*#203\*\*[^\n]*/,
    '| **NEXT** | `p10-casino-replay-and-infra` | YAML **#204** · Casino lobby `#203` `[x]` · CasinoR#1 |',
  );
  text = text.replace(
    /\*\*마지막 completed = `p10-sports-rules-and-vip-stub`\*\* · \*\*현재 NEXT = `p10-page-casino`\*\* \(§20\.13\.3 Sports#4 · YAML \*\*#203\*\*\)[^\n]*/,
    '**마지막 completed = `p10-page-casino`** · **현재 NEXT = `p10-casino-replay-and-infra`** (§23.5 · YAML **#204**) · **직선 큐:** CasinoR→… → da-w6 → P11 → P12 → da-w8 → P13 → da-w7(strict) → T1/T2 → ew-e0 · cancelled `p2-defer-*` 7건 = YAML **맨 끝** (49차)  ',
  );

  writeFileSync(PLAN_PATH, text);
  const todos = parsePlanYamlTodos(PLAN_PATH);
  const summary = summarizePlanTodos(todos);
  const casino = todos.find((x) => x.id === 'p10-page-casino');
  const next = todos.find((x) => x.id === 'p10-casino-replay-and-infra');
  console.log(
    JSON.stringify(
      {
        marked: true,
        casino: casino?.status,
        next: next?.status,
        summary,
      },
      null,
      2,
    ),
  );
  if (
    casino?.status !== 'completed' ||
    next?.status !== 'pending' ||
    summary.firstPendingId !== 'p10-casino-replay-and-infra' ||
    summary.completed !== 203
  ) {
    console.error('FAIL post-mark', {
      casino: casino?.status,
      next: next?.status,
      summary,
    });
    process.exit(1);
  }
}

main();
