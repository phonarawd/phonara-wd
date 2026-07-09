#!/usr/bin/env node
/**
 * check-plan-doc-sync.ts — YAML counts vs repo plan mirror docs (non-waivable after YAML touch)
 * Usage: bun run check:plan-doc-sync -- "<plan.md path>"
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parsePlanYamlTodos, summarizePlanTodos } from './lib/parse-plan-yaml-todos';

const REPO_ROOT = resolve(import.meta.dirname, '..');
const PLAN_DEFAULT = resolve(
  process.env.USERPROFILE ?? '',
  '.cursor/plans/phase_r_super-app_8bdf2c10.plan.md',
);

const CANONICAL_COUNTS = (summary: ReturnType<typeof summarizePlanTodos>) => ({
  idsLabel: `${summary.ids} ids`,
  completed: `completed **${summary.completed}**`,
  pending: `pending **${summary.pending}**`,
  cancelled: `cancelled **${summary.cancelled}**`,
  mirror: `${summary.completed}/${summary.ids}`,
  next: summary.firstPendingId,
  nextNum: `#${summary.firstPendingIndex}`,
});

function extractTableIds(markdown: string): string[] {
  const section = markdown.match(/## §AI Todo Sync[\s\S]*/)?.[0] ?? '';
  return [...section.matchAll(/^\| `([a-z0-9-]+)` \| /gm)].map((m) => m[1]);
}

function assertContains(text: string, needle: string, label: string, failures: string[]) {
  if (!text.includes(needle)) failures.push(`${label}: missing "${needle}"`);
}

function assertNotContains(text: string, needle: string, label: string, failures: string[]) {
  if (text.includes(needle)) failures.push(`${label}: stale "${needle}"`);
}

function main() {
  const planPath = process.argv[2] ? resolve(process.argv[2]) : PLAN_DEFAULT;
  const todos = parsePlanYamlTodos(planPath);
  const summary = summarizePlanTodos(todos);
  const canon = CANONICAL_COUNTS(summary);
  const failures: string[] = [];

  const paths = {
    ACTIVE_WORK_SSOT: resolve(REPO_ROOT, 'docs/SSOT/ACTIVE_WORK_SSOT.md'),
    REBUILD_PLAN_v1: resolve(REPO_ROOT, 'docs/PRODUCT/REBUILD_PLAN_v1.md'),
    CURRENT_STATUS: resolve(REPO_ROOT, 'docs/CURRENT_STATUS.md'),
    APPS_WEB_AGENTS: resolve(REPO_ROOT, 'apps/web/AGENTS.md'),
    PLAN_BODY: readFileSync(planPath, 'utf8'),
  };

  const docs = {
    ACTIVE_WORK_SSOT: readFileSync(paths.ACTIVE_WORK_SSOT, 'utf8'),
    REBUILD_PLAN_v1: readFileSync(paths.REBUILD_PLAN_v1, 'utf8'),
    CURRENT_STATUS: readFileSync(paths.CURRENT_STATUS, 'utf8'),
    APPS_WEB_AGENTS: readFileSync(paths.APPS_WEB_AGENTS, 'utf8'),
    PLAN_BODY: paths.PLAN_BODY,
  };

  for (const [name, text] of Object.entries(docs)) {
    assertContains(text, canon.idsLabel, name, failures);
    if (name !== 'PLAN_BODY') {
      assertContains(text, canon.completed, name, failures);
      assertContains(text, canon.pending, name, failures);
    }
    assertNotContains(text, '166/285', name, failures);
    assertNotContains(text, 'completed **156**', name, failures);
    assertNotContains(text, 'completed **153**', name, failures);
    assertNotContains(text, 'pending **129**', name, failures);
    assertNotContains(text, 'pending **132**', name, failures);
    assertNotContains(text, 'pending **134**', name, failures);
  }

  assertNotContains(docs.REBUILD_PLAN_v1, '285 ids', 'REBUILD_PLAN_v1', failures);

  assertContains(docs.CURRENT_STATUS, canon.mirror, 'CURRENT_STATUS', failures);
  assertContains(docs.CURRENT_STATUS, canon.next, 'CURRENT_STATUS', failures);
  assertContains(docs.PLAN_BODY, `\`completed\` **${summary.completed}**`, 'PLAN_BODY', failures);
  assertContains(docs.PLAN_BODY, `\`pending\` **${summary.pending}**`, 'PLAN_BODY', failures);
  assertContains(docs.PLAN_BODY, `\`${summary.firstPendingId}\``, 'PLAN_BODY', failures);
  assertNotContains(
    docs.PLAN_BODY,
    '**현재 NEXT:** `p9-operator-visual-signoff`',
    'PLAN_BODY',
    failures,
  );
  assertNotContains(
    docs.PLAN_BODY,
    '| **NEXT** | `p9-operator-visual-signoff` |',
    'PLAN_BODY',
    failures,
  );

  const tableIds = extractTableIds(docs.CURRENT_STATUS);
  const yamlIds = todos.map((t) => t.id);
  if (tableIds.length !== yamlIds.length) {
    failures.push(`CURRENT_STATUS table rows ${tableIds.length} !== YAML ${yamlIds.length}`);
  }
  for (let i = 0; i < yamlIds.length; i++) {
    if (tableIds[i] !== yamlIds[i]) {
      failures.push(
        `CURRENT_STATUS order #${i + 1}: ${tableIds[i] ?? 'MISSING'} !== ${yamlIds[i]}`,
      );
      break;
    }
  }

  console.log(
    JSON.stringify(
      {
        yaml: summary,
        tableRows: tableIds.length,
        failures: failures.length ? failures : 'none',
      },
      null,
      2,
    ),
  );

  if (failures.length > 0) {
    console.error('\n❌ FAIL — run: bun run sync:plan-doc-mirror');
    process.exit(1);
  }
  console.log('\n✅ PASS');
}

main();
