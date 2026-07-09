#!/usr/bin/env node
/**
 * Mark da-w0-foundation-ssot-bundle completed + sync §20.6 counts/NEXT to da-w1.
 * Usage: bun run scripts/mark-da-w0-foundation-completed.ts
 *
 * Status + §20.6 mirrors only — does not rewrite plan §34 body.
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
    /( {2}- id: da-w0-foundation-ssot-bundle\r?\n {4}content: "[\s\S]*?"\r?\n {4}status: )(?:in_progress|pending)/,
    '$1completed',
  );

  text = text.replace(
    /\*\*status 실측 \(2026-07-09 · R0 gate `\[x\]`\):\*\* `completed` \*\*184\*\* · `pending` \*\*87\*\* · `cancelled` \*\*7\*\*/,
    '**status 실측 (2026-07-09 · DA W0 `[x]`):** `completed` **185** · `pending` **86** · `cancelled` **7**',
  );
  text = text.replace(
    /\*\*현재 NEXT:\*\* `da-w0-foundation-ssot-bundle` \(YAML \*\*#185\*\*\)[^\n]*/,
    '**현재 NEXT:** `da-w1-ds-foundation-bundle` (YAML **#186**) · **왕초보:** completed 스킵 · **첫 pending 1개만** · DA W0 `[x]` → W1 DS',
  );
  text = text.replace(
    /\| \*\*completed\*\* \| \*\*184\*\* \| frontmatter `status: completed` 실측 \|/,
    '| **completed** | **185** | frontmatter `status: completed` 실측 |',
  );
  text = text.replace(
    /\| \*\*pending\*\* \| \*\*87\*\* \| 184\+87\+7=278 \|/,
    '| **pending** | **86** | 185+86+7=278 |',
  );
  text = text.replace(
    /\| \*\*NEXT\*\* \| `da-w0-foundation-ssot-bundle` \| YAML \*\*#185\*\*[^\n]*/,
    '| **NEXT** | `da-w1-ds-foundation-bundle` | YAML **#186** · DA W0 `[x]` · §34.6–34.9 DS 2.0 |',
  );
  text = text.replace(
    /\*\*마지막 completed = `r0-gate-forensic-remediation`\*\* · \*\*현재 NEXT = `da-w0-foundation-ssot-bundle`\*\* \(§34 DA · YAML \*\*#185\*\*\) · \*\*직선 큐:\*\* da-w0→w1→w2→w3→w4→w5 →[^\n]*/,
    '**마지막 completed = `da-w0-foundation-ssot-bundle`** · **현재 NEXT = `da-w1-ds-foundation-bundle`** (§34 DA · YAML **#186**) · **직선 큐:** da-w1→w2→w3→w4→w5 → P10 잔여(Fiat#10→prematch→…→Sports#1–7→CasinoR#1→…) → da-w6 → P11 → P12 → da-w8 → P13 → da-w7(strict) → T1/T2 → ew-e0 · cancelled `p2-defer-*` 7건 = YAML **맨 끝** (49차)  ',
  );

  writeFileSync(PLAN_PATH, text);
  const todos = parsePlanYamlTodos(PLAN_PATH);
  const summary = summarizePlanTodos(todos);
  const daw0 = todos.find((x) => x.id === 'da-w0-foundation-ssot-bundle');
  const daw1 = todos.find((x) => x.id === 'da-w1-ds-foundation-bundle');
  console.log(
    JSON.stringify(
      {
        marked: true,
        daw0: daw0?.status,
        daw1: daw1?.status,
        summary,
      },
      null,
      2,
    ),
  );
  if (
    daw0?.status !== 'completed' ||
    daw1?.status !== 'pending' ||
    summary.firstPendingId !== 'da-w1-ds-foundation-bundle' ||
    summary.completed !== 185
  ) {
    console.error('FAIL post-mark', {
      daw0: daw0?.status,
      daw1: daw1?.status,
      summary,
    });
    process.exit(1);
  }
}

main();
