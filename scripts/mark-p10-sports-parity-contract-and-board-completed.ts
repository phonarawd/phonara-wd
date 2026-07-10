#!/usr/bin/env node
/**
 * Mark p10-sports-parity-contract-and-board completed + sync §20.6 NEXT to live-surface.
 * Usage: bun run scripts/mark-p10-sports-parity-contract-and-board-completed.ts
 *
 * Run only after gate:ai-impl sports parity+board green.
 * Note: operator may forbid plan edits in a session — then skip this script and sync docs only.
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
    /( {2}- id: p10-sports-parity-contract-and-board\r?\n {4}content: "[\s\S]*?"\r?\n {4}status: )(?:in_progress|pending)/,
    '$1completed',
  );

  text = text.replace(
    /\*\*status 실측 \(2026-07-10 · Sports#0 `#197` `\[x\]`\):\*\* `completed` \*\*197\*\* · `pending` \*\*74\*\* · `cancelled` \*\*7\*\*/,
    '**status 실측 (2026-07-10 · Sports#1 `#198` `[x]`):** `completed` **198** · `pending` **73** · `cancelled` **7**',
  );
  text = text.replace(
    /\*\*현재 NEXT:\*\* `p10-sports-parity-contract-and-board` \(YAML \*\*#198\*\*\)[^\n]*/,
    '**현재 NEXT:** `p10-sports-live-surface-wire` (YAML **#199**) · **왕초보:** completed 스킵 · **첫 pending 1개만** · Sports#1 `#198` `[x]` → Sports#2 live',
  );
  text = text.replace(
    /\| \*\*completed\*\* \| \*\*197\*\* \| frontmatter `status: completed` 실측 \|/,
    '| **completed** | **198** | frontmatter `status: completed` 실측 |',
  );
  text = text.replace(
    /\| \*\*pending\*\* \| \*\*74\*\* \| 197\+74\+7=278 \|/,
    '| **pending** | **73** | 198+73+7=278 |',
  );
  text = text.replace(
    /\| \*\*NEXT\*\* \| `p10-sports-parity-contract-and-board` \| YAML \*\*#198\*\*[^\n]*/,
    '| **NEXT** | `p10-sports-live-surface-wire` | YAML **#199** · Sports#1 `#198` `[x]` · Sports#2 |',
  );
  text = text.replace(
    /\*\*마지막 completed = `p10-sports-hub-pages`\*\* · \*\*현재 NEXT = `p10-sports-parity-contract-and-board`\*\* \(§20\.13\.3 Sports#0 · YAML \*\*#198\*\*\)[^\n]*/,
    '**마지막 completed = `p10-sports-parity-contract-and-board`** · **현재 NEXT = `p10-sports-live-surface-wire`** (§20.13.3 Sports#1 · YAML **#199**) · **직선 큐:** Sports#2 live→slip→…→CasinoR→… → da-w6 → P11 → P12 → da-w8 → P13 → da-w7(strict) → T1/T2 → ew-e0 · cancelled `p2-defer-*` 7건 = YAML **맨 끝** (49차)  ',
  );

  writeFileSync(PLAN_PATH, text);
  const todos = parsePlanYamlTodos(PLAN_PATH);
  const summary = summarizePlanTodos(todos);
  const parity = todos.find((x) => x.id === 'p10-sports-parity-contract-and-board');
  const next = todos.find((x) => x.id === 'p10-sports-live-surface-wire');
  console.log(
    JSON.stringify(
      {
        marked: true,
        parity: parity?.status,
        next: next?.status,
        summary,
      },
      null,
      2,
    ),
  );
  if (
    parity?.status !== 'completed' ||
    next?.status !== 'pending' ||
    summary.firstPendingId !== 'p10-sports-live-surface-wire' ||
    summary.completed !== 198
  ) {
    console.error('FAIL post-mark', {
      parity: parity?.status,
      next: next?.status,
      summary,
    });
    process.exit(1);
  }
}

main();
