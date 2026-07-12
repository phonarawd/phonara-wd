/**
 * Cursor Plan YAML frontmatter — mark todo `status: completed` (idempotent).
 * Used by `closeout:todo` and `gate:ai-impl --closeout`.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

import {
  parsePlanYamlTodos,
  summarizePlanTodos,
  type PlanTodoStatus,
} from './parse-plan-yaml-todos';

/** Fast path for active execution plans (extend when new Plan becomes SSOT). */
export const KNOWN_PLAN_PATHS: readonly string[] = [
  join(homedir(), '.cursor/plans/platform-perfect-launch_6982dfdf.plan.md'),
  join(homedir(), '.cursor/plans/phase_r_super-app_8bdf2c10.plan.md'),
] as const;

export function listCursorPlanPaths(): string[] {
  const dir = join(homedir(), '.cursor/plans');
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith('.plan.md'))
      .map((f) => join(dir, f));
  } catch {
    return [];
  }
}

function planContainsTodo(planPath: string, todoId: string): boolean {
  try {
    return parsePlanYamlTodos(planPath).some((t) => t.id === todoId);
  } catch {
    return false;
  }
}

/** Resolve plan file that owns `todoId`. */
export function findPlanPathForTodo(todoId: string, explicitPlan?: string): string {
  if (explicitPlan) {
    const resolved = resolve(explicitPlan);
    if (!planContainsTodo(resolved, todoId)) {
      throw new Error(`todo "${todoId}" not found in explicit plan ${resolved}`);
    }
    return resolved;
  }

  const candidates = [
    ...KNOWN_PLAN_PATHS,
    ...listCursorPlanPaths().filter((p) => !KNOWN_PLAN_PATHS.includes(p)),
  ];

  for (const planPath of candidates) {
    if (planContainsTodo(planPath, todoId)) return planPath;
  }

  throw new Error(
    `todo "${todoId}": no ~/.cursor/plans/*.plan.md contains this id — pass --plan <path>`,
  );
}

function findFrontmatterStatusLine(lines: string[], todoId: string): number {
  const fmStart = lines.findIndex((l) => l.trim() === '---');
  const fmEnd = lines.findIndex((l, i) => i > fmStart && l.trim() === '---');
  if (fmStart === -1 || fmEnd === -1) {
    throw new Error('plan frontmatter block not found');
  }

  let activeId: string | null = null;
  for (let i = fmStart + 1; i < fmEnd; i++) {
    const idMatch = lines[i]?.match(/^\s+- id:\s*(.+)$/);
    if (idMatch) {
      activeId = idMatch[1]!.trim();
      continue;
    }
    if (activeId === todoId) {
      const statusMatch = lines[i]?.match(/^(\s+status:\s*)(\S+)/);
      if (statusMatch) return i;
    }
  }

  throw new Error(`todo "${todoId}": status line not found in frontmatter`);
}

export type MarkPlanTodoResult = {
  planPath: string;
  todoId: string;
  previousStatus: PlanTodoStatus | null;
  changed: boolean;
  summary: ReturnType<typeof summarizePlanTodos>;
};

/** Mark one Plan todo completed. Idempotent when already completed. */
export function markPlanTodoCompleted(planPath: string, todoId: string): MarkPlanTodoResult {
  const resolved = resolve(planPath);
  const before = parsePlanYamlTodos(resolved);
  const todo = before.find((t) => t.id === todoId);
  if (!todo) {
    throw new Error(`todo "${todoId}" not found in ${resolved}`);
  }

  if (todo.status === 'completed') {
    return {
      planPath: resolved,
      todoId,
      previousStatus: 'completed',
      changed: false,
      summary: summarizePlanTodos(before),
    };
  }

  if (todo.status === 'cancelled') {
    throw new Error(`todo "${todoId}" is cancelled — cannot mark completed`);
  }

  const raw = readFileSync(resolved, 'utf8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const lines = raw.split(/\r?\n/);
  const statusLine = findFrontmatterStatusLine(lines, todoId);
  const statusMatch = lines[statusLine]!.match(/^(\s+status:\s*)(\S+)/);
  if (!statusMatch) {
    throw new Error(`todo "${todoId}": malformed status line`);
  }

  const previousStatus = statusMatch[2] as PlanTodoStatus;
  lines[statusLine] = `${statusMatch[1]}completed`;
  writeFileSync(resolved, lines.join(eol), 'utf8');

  const after = parsePlanYamlTodos(resolved);
  const marked = after.find((t) => t.id === todoId);
  if (marked?.status !== 'completed') {
    throw new Error(`todo "${todoId}": post-write status=${marked?.status ?? 'missing'}`);
  }

  return {
    planPath: resolved,
    todoId,
    previousStatus,
    changed: true,
    summary: summarizePlanTodos(after),
  };
}
