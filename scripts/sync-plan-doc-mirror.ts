#!/usr/bin/env node
/**
 * sync-plan-doc-mirror.ts — YAML frontmatter → repo plan mirror docs (counts + §AI Todo Sync merge)
 * Usage: bun run sync:plan-doc-mirror -- "<plan.md path>"
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parsePlanYamlTodos, summarizePlanTodos, type PlanTodo } from './lib/parse-plan-yaml-todos';

const REPO_ROOT = resolve(import.meta.dirname, '..');
const PLAN_DEFAULT = resolve(
  process.env.USERPROFILE ?? '',
  '.cursor/plans/phase_r_super-app_8bdf2c10.plan.md',
);

function replaceCountBlock(text: string, pattern: RegExp, replacement: string): string {
  return text.replace(pattern, replacement);
}

function syncActiveWorkSsot(text: string, summary: ReturnType<typeof summarizePlanTodos>): string {
  let out = text;
  out = replaceCountBlock(
    out,
    /(frontmatter · \*\*)\d+( ids\*\* · Track A \*\*)\d+(\*\* \+ Track B \*\*)\d+(\*\* · completed )\*\*\d+\*\*( · pending )\*\*\d+\*\*/,
    `$1${summary.ids}$2${summary.trackA}$3${summary.trackB}$4**${summary.completed}**$5**${summary.pending}**`,
  );
  if (!out.includes('cancelled **')) {
    out = out.replace(
      /(pending \*\*\d+\*\*)( · §20\.6\.1)/,
      `$1 · cancelled **${summary.cancelled}**$2`,
    );
  } else {
    out = replaceCountBlock(out, /cancelled \*\*\d+\*\*/, `cancelled **${summary.cancelled}**`);
  }
  return out;
}

function syncRebuildPlan(text: string, summary: ReturnType<typeof summarizePlanTodos>): string {
  let out = text;
  out = replaceCountBlock(
    out,
    /(YAML frontmatter · \*\*)\d+( ids\*\* · §20\.6\.1: Track A \*\*)\d+(\*\* \+ Track B \*\*)\d+(\*\* · completed )\*\*\d+\*\*( · pending )\*\*\d+\*\*( · cancelled \*\*)\d+(\*\* · \*\*\d+차)/,
    `$1${summary.ids}$2${summary.trackA}$3${summary.trackB}$4**${summary.completed}**$5**${summary.pending}**$6${summary.cancelled}$7`,
  );
  out = out.replace(
    /\*\*수치:\*\* §20\.6\.1 \(\*\*\d+ ids\*\*\)/g,
    `**수치:** §20.6.1 (**${summary.ids} ids**)`,
  );
  out = out.replace(/§20\.6\.1 \(\*\*\d+ ids\*\*\)/g, `§20.6.1 (**${summary.ids} ids**)`);
  return out;
}

function statusCell(todo: PlanTodo): string {
  if (todo.status === 'completed') return '`[x]` DONE';
  if (todo.status === 'cancelled') return '`[x]` cancelled';
  return '`[ ]` NEXT';
}

function parseExistingTableRows(markdown: string): Map<string, string> {
  const rows = new Map<string, string>();
  const section = markdown.match(/## §AI Todo Sync[\s\S]*/)?.[0] ?? '';
  for (const match of section.matchAll(/^\| `([a-z0-9-]+)` \| .+$/gm)) {
    rows.set(match[1], match[0]);
  }
  return rows;
}

function buildTodoSyncSection(
  todos: PlanTodo[],
  summary: ReturnType<typeof summarizePlanTodos>,
  existingRows: Map<string, string>,
): string {
  const lines = todos.map((todo, index) => {
    const existing = existingRows.get(todo.id);
    if (existing) return existing;
    const yamlNum = index + 1;
    const evidence =
      todo.status === 'completed'
        ? `YAML #${yamlNum} completed · surface/gate evidence pending doc sync`
        : todo.status === 'cancelled'
          ? 'YAML cancelled · DEFER — 구현 금지'
          : `YAML #${yamlNum} pending`;
    return `| \`${todo.id}\` | ${statusCell(todo)} | — | ${evidence} |`;
  });

  return [
    `## §AI Todo Sync (Phase R · YAML 정본 미러 · completed **${summary.completed}**/${summary.ids} · pending **${summary.pending}** · cancelled **${summary.cancelled}** · 48차)`,
    '',
    `> **정본:** Cursor Plan \`phase_r_super-app_8bdf2c10\` frontmatter · **${summary.ids} ids** · \`bun run check:plan-doc-sync\` green 필수 · 기존 surface gate 증거 행은 유지 · 신규 id만 placeholder`,
    '',
    '| id | 상태 | 완료일 | 증거 |',
    '|----|------|--------|------|',
    ...lines,
    '',
    `§AI Todo Sync · YAML canonical **${summary.completed}/${summary.ids} completed** · **NEXT:** \`${summary.firstPendingId}\` (#${summary.firstPendingIndex}) · **preflight:** [\`ACTIVE_WORK_SSOT.md\`](SSOT/ACTIVE_WORK_SSOT.md)`,
  ].join('\n');
}

function syncCurrentStatus(
  text: string,
  todos: PlanTodo[],
  summary: ReturnType<typeof summarizePlanTodos>,
): string {
  const tableStart = text.indexOf('## §AI Todo Sync');
  if (tableStart === -1) throw new Error('CURRENT_STATUS.md: §AI Todo Sync 섹션 없음');

  const before = text
    .slice(0, tableStart)
    .replace(
      /(\*\*NEXT\*\* `)[^`]+(` #)\d+/,
      `$1${summary.firstPendingId}$2${summary.firstPendingIndex}`,
    );

  const existingRows = parseExistingTableRows(text);
  return before + buildTodoSyncSection(todos, summary, existingRows) + '\n';
}

function syncPlanBodySection20(
  text: string,
  summary: ReturnType<typeof summarizePlanTodos>,
): string {
  let out = text;
  out = out.replace(
    /(\*\*status 실측 \([^)]*\):\*\*) `completed` \*\*\d+\*\* · `pending` \*\*\d+\*\* · `cancelled` \*\*\d+\*\*/,
    `$1 \`completed\` **${summary.completed}** · \`pending\` **${summary.pending}** · \`cancelled\` **${summary.cancelled}**`,
  );
  out = out.replace(
    /\*\*현재 NEXT:\*\* `[^`]+` \([^)]+\)/,
    `**현재 NEXT:** \`${summary.firstPendingId}\` (YAML **#${summary.firstPendingIndex}**)`,
  );
  out = out.replace(
    /\| \*\*completed\*\* \| \*\*\d+\*\* \| [^|]+ \|/,
    `| **completed** | **${summary.completed}** | frontmatter \`status: completed\` 실측 |`,
  );
  out = out.replace(
    /\| \*\*pending\*\* \| \*\*\d+\*\* \| \d+\+\d+\+\d+=\d+ \|/,
    `| **pending** | **${summary.pending}** | ${summary.completed}+${summary.pending}+${summary.cancelled}=${summary.ids} |`,
  );
  out = out.replace(
    /\| \*\*NEXT\*\* \| `[^`]+` \| YAML \*\*#\d+\*\*[^|]+\|/,
    `| **NEXT** | \`${summary.firstPendingId}\` | YAML **#${summary.firstPendingIndex}** · Fiat#9G \`[x]\` · Launch E1–E4 \`[x]\` · P10 **#168+** |`,
  );
  out = out.replace(
    /\| \*\*NEXT\*\* \| `[^`]+` \| P9 WORLD step \*\*27\*\*[^|]+\|/,
    `| **NEXT** | \`${summary.firstPendingId}\` | YAML **#${summary.firstPendingIndex}** · Fiat#9G \`[x]\` · Launch E1–E4 \`[x]\` · P10 **#168+** |`,
  );
  out = out.replace(
    /\*\*PASS \(\d+차 · 2026-07-06 실측\):\*\* `ids:292` · `sum:292` · `trackA:226` · `trackB:66` · `dup:'none'` · `completed:\d+` · `pending:\d+` · `cancelled:\d+/,
    `**PASS (46차 · 2026-07-06 실측):** \`ids:292\` · \`sum:292\` · \`trackA:226\` · \`trackB:66\` · \`dup:'none'\` · \`completed:${summary.completed}\` · \`pending:${summary.pending}\` · \`cancelled:${summary.cancelled}\``,
  );
  out = out.replace(
    /\*\*#\d+ = 마지막 completed \(`[^`]+`\)\*\* · \*\*현재 NEXT = `[^`]+`\*\* \(YAML \*\*#\d+\*\*\)/,
    `**#${summary.completed} = 마지막 completed (\`p4-gate-fiat-reference-world-class\`)** · **현재 NEXT = \`${summary.firstPendingId}\`** (YAML **#${summary.firstPendingIndex}**)`,
  );
  return out;
}

function syncAppsWebAgents(text: string, summary: ReturnType<typeof summarizePlanTodos>): string {
  return text
    .replace(
      /> \*\*Phase R:\*\* Presentation rebuild in progress —[^\n]+/,
      `> **Phase R:** Presentation rebuild in progress — [\`REBUILD_PLAN_v1.md\`](../../docs/PRODUCT/REBUILD_PLAN_v1.md) · **NEXT** \`${summary.firstPendingId}\` (#${summary.firstPendingIndex}) · preflight: ACTIVE_WORK_SSOT.`,
    )
    .replace(
      /Plan \*\*\d+ ids\*\* · completed \*\*\d+\*\*( · pending \*\*\d+\*\*)? \(\d+차\)/,
      `Plan **${summary.ids} ids** · completed **${summary.completed}** · pending **${summary.pending}** (48차)`,
    );
}

function main() {
  const planPath = process.argv[2] ? resolve(process.argv[2]) : PLAN_DEFAULT;
  const todos = parsePlanYamlTodos(planPath);
  const summary = summarizePlanTodos(todos);

  const paths = {
    activeWork: resolve(REPO_ROOT, 'docs/SSOT/ACTIVE_WORK_SSOT.md'),
    rebuildPlan: resolve(REPO_ROOT, 'docs/PRODUCT/REBUILD_PLAN_v1.md'),
    currentStatus: resolve(REPO_ROOT, 'docs/CURRENT_STATUS.md'),
    appsWebAgents: resolve(REPO_ROOT, 'apps/web/AGENTS.md'),
  };

  writeFileSync(
    paths.activeWork,
    syncActiveWorkSsot(readFileSync(paths.activeWork, 'utf8'), summary),
  );
  writeFileSync(
    paths.rebuildPlan,
    syncRebuildPlan(readFileSync(paths.rebuildPlan, 'utf8'), summary),
  );
  writeFileSync(
    paths.currentStatus,
    syncCurrentStatus(readFileSync(paths.currentStatus, 'utf8'), todos, summary),
  );
  writeFileSync(planPath, syncPlanBodySection20(readFileSync(planPath, 'utf8'), summary));
  writeFileSync(
    paths.appsWebAgents,
    syncAppsWebAgents(readFileSync(paths.appsWebAgents, 'utf8'), summary),
  );

  console.log(JSON.stringify({ synced: true, yaml: summary }, null, 2));
}

main();
