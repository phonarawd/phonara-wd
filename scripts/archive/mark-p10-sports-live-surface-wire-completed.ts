#!/usr/bin/env node
/**
 * Mark p10-sports-live-surface-wire completed + sync §20.6 NEXT to slip-advanced.
 * Usage: bun run scripts/mark-p10-sports-live-surface-wire-completed.ts
 *
 * Run only after gate:ai-impl sports live surface green.
 * Note: skip if operator forbids plan edits in the session — docs already synced.
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
    /( {2}- id: p10-sports-live-surface-wire\r?\n {4}content: "[\s\S]*?"\r?\n {4}status: )(?:in_progress|pending)/,
    '$1completed',
  );

  text = text.replace(
    /\*\*status 실측 \(2026-07-10 · Sports#1 `#198` `\[x\]`\):\*\* `completed` \*\*198\*\* · `pending` \*\*73\*\* · `cancelled` \*\*7\*\*/,
    '**status 실측 (2026-07-10 · Sports#2 `#199` `[x]`):** `completed` **199** · `pending` **72** · `cancelled` **7**',
  );
  text = text.replace(
    /\*\*현재 NEXT:\*\* `p10-sports-live-surface-wire` \(YAML \*\*#199\*\*\)[^\n]*/,
    '**현재 NEXT:** `p10-sports-slip-advanced-wire` (YAML **#200**) · **왕초보:** completed 스킵 · **첫 pending 1개만** · Sports#2 `#199` `[x]` → Sports#3 slip',
  );
  text = text.replace(
    /\| \*\*completed\*\* \| \*\*198\*\* \| frontmatter `status: completed` 실측 \|/,
    '| **completed** | **199** | frontmatter `status: completed` 실측 |',
  );
  text = text.replace(
    /\| \*\*pending\*\* \| \*\*73\*\* \| 198\+73\+7=278 \|/,
    '| **pending** | **72** | 199+72+7=278 |',
  );
  text = text.replace(
    /\| \*\*NEXT\*\* \| `p10-sports-live-surface-wire` \| YAML \*\*#199\*\*[^\n]*/,
    '| **NEXT** | `p10-sports-slip-advanced-wire` | YAML **#200** · Sports#2 `#199` `[x]` · Sports#3 |',
  );
  text = text.replace(
    /\*\*마지막 completed = `p10-sports-parity-contract-and-board`\*\* · \*\*현재 NEXT = `p10-sports-live-surface-wire`\*\* \(§20\.13\.3 Sports#1 · YAML \*\*#199\*\*\)[^\n]*/,
    '**마지막 completed = `p10-sports-live-surface-wire`** · **현재 NEXT = `p10-sports-slip-advanced-wire`** (§20.13.3 Sports#2 · YAML **#200**) · **직선 큐:** Sports#3 slip→…→CasinoR→… → da-w6 → P11 → P12 → da-w8 → P13 → da-w7(strict) → T1/T2 → ew-e0 · cancelled `p2-defer-*` 7건 = YAML **맨 끝** (49차)  ',
  );

  writeFileSync(PLAN_PATH, text);
  const todos = parsePlanYamlTodos(PLAN_PATH);
  const summary = summarizePlanTodos(todos);
  const live = todos.find((x) => x.id === 'p10-sports-live-surface-wire');
  const next = todos.find((x) => x.id === 'p10-sports-slip-advanced-wire');
  console.log(
    JSON.stringify(
      {
        marked: true,
        live: live?.status,
        next: next?.status,
        summary,
      },
      null,
      2,
    ),
  );
  if (
    live?.status !== 'completed' ||
    next?.status !== 'pending' ||
    summary.firstPendingId !== 'p10-sports-slip-advanced-wire' ||
    summary.completed !== 199
  ) {
    console.error('FAIL post-mark', {
      live: live?.status,
      next: next?.status,
      summary,
    });
    process.exit(1);
  }
}

main();
