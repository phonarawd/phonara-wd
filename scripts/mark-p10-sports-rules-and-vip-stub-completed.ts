#!/usr/bin/env node
/**
 * Mark p10-sports-rules-and-vip-stub completed + sync §20.6 NEXT to p10-page-casino.
 * Usage: bun run scripts/mark-p10-sports-rules-and-vip-stub-completed.ts
 *
 * Run only after gate:ai-impl sports rules+vip green.
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
    /( {2}- id: p10-sports-rules-and-vip-stub\r?\n {4}content: "[\s\S]*?"\r?\n {4}status: )(?:in_progress|pending)/,
    '$1completed',
  );

  text = text.replace(
    /\*\*status 실측 \(2026-07-10 · Sports#2 `#199` `\[x\]`\):\*\* `completed` \*\*199\*\* · `pending` \*\*72\*\* · `cancelled` \*\*7\*\*/,
    '**status 실측 (2026-07-10 · Sports#4 `#202` `[x]`):** `completed` **202** · `pending` **69** · `cancelled` **7**',
  );
  text = text.replace(
    /\*\*현재 NEXT:\*\* `p10-sports-slip-advanced-wire` \(YAML \*\*#200\*\*\)[^\n]*/,
    '**현재 NEXT:** `p10-page-casino` (YAML **#203**) · **왕초보:** completed 스킵 · **첫 pending 1개만** · Sports#4 `#202` `[x]` → P10 casino',
  );
  text = text.replace(
    /\| \*\*completed\*\* \| \*\*199\*\* \| frontmatter `status: completed` 실측 \|/,
    '| **completed** | **202** | frontmatter `status: completed` 실측 |',
  );
  text = text.replace(
    /\| \*\*pending\*\* \| \*\*72\*\* \| 199\+72\+7=278 \|/,
    '| **pending** | **69** | 202+69+7=278 |',
  );
  text = text.replace(
    /\| \*\*NEXT\*\* \| `p10-sports-slip-advanced-wire` \| YAML \*\*#200\*\*[^\n]*/,
    '| **NEXT** | `p10-page-casino` | YAML **#203** · Sports#4 `#202` `[x]` · Casino lobby |',
  );
  text = text.replace(
    /\*\*마지막 completed = `p10-sports-live-surface-wire`\*\* · \*\*현재 NEXT = `p10-sports-slip-advanced-wire`\*\* \(§20\.13\.3 Sports#2 · YAML \*\*#200\*\*\)[^\n]*/,
    '**마지막 completed = `p10-sports-rules-and-vip-stub`** · **현재 NEXT = `p10-page-casino`** (§20.13.3 Sports#4 · YAML **#203**) · **직선 큐:** CasinoR→… → da-w6 → P11 → P12 → da-w8 → P13 → da-w7(strict) → T1/T2 → ew-e0 · cancelled `p2-defer-*` 7건 = YAML **맨 끝** (49차)  ',
  );

  writeFileSync(PLAN_PATH, text);
  const todos = parsePlanYamlTodos(PLAN_PATH);
  const summary = summarizePlanTodos(todos);
  const rulesVip = todos.find((x) => x.id === 'p10-sports-rules-and-vip-stub');
  const next = todos.find((x) => x.id === 'p10-page-casino');
  console.log(
    JSON.stringify(
      {
        marked: true,
        rulesVip: rulesVip?.status,
        next: next?.status,
        summary,
      },
      null,
      2,
    ),
  );
  if (
    rulesVip?.status !== 'completed' ||
    next?.status !== 'pending' ||
    summary.firstPendingId !== 'p10-page-casino' ||
    summary.completed !== 202
  ) {
    console.error('FAIL post-mark', {
      rulesVip: rulesVip?.status,
      next: next?.status,
      summary,
    });
    process.exit(1);
  }
}

main();
