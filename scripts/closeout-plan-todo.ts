#!/usr/bin/env node
/**
 * Mark a Cursor Plan frontmatter todo as `status: completed`.
 *
 * Usage:
 *   bun run closeout:todo -- audit-r2b-withdrawal-copy
 *   bun run closeout:todo -- audit-r2b-withdrawal-copy --evidence "gate:ai-impl green · 9/9"
 *   bun run closeout:todo -- <todo-id> --plan "C:/Users/PC/.cursor/plans/foo.plan.md"
 *
 * AI MUST run this at task closeout (rule 99-plan-todo-auto-closeout).
 */
import { findPlanPathForTodo, markPlanTodoCompleted } from './lib/plan-todo-closeout';

function parseArgs(): { todoId: string; planPath?: string; evidence?: string } {
  const argv = process.argv.slice(2);
  let todoId = '';
  let planPath: string | undefined;
  let evidence: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]!;
    if (token === '--plan') {
      planPath = argv[++i];
      continue;
    }
    if (token === '--evidence') {
      evidence = argv[++i];
      continue;
    }
    if (!token.startsWith('--') && !todoId) {
      todoId = token;
    }
  }

  if (!todoId) {
    console.error('Usage: bun run closeout:todo -- <todo-id> [--plan <path>] [--evidence "..."]');
    process.exit(1);
  }

  return { todoId, planPath, evidence };
}

function main(): void {
  const { todoId, planPath, evidence } = parseArgs();
  const resolvedPlan = findPlanPathForTodo(todoId, planPath);
  const result = markPlanTodoCompleted(resolvedPlan, todoId);

  console.log(
    JSON.stringify(
      {
        ok: true,
        todoId: result.todoId,
        planPath: result.planPath,
        previousStatus: result.previousStatus,
        changed: result.changed,
        summary: result.summary,
        evidence: evidence ?? null,
      },
      null,
      2,
    ),
  );

  if (result.changed) {
    console.log(`[closeout:todo] ✓ ${todoId} → completed (${result.planPath})`);
  } else {
    console.log(`[closeout:todo] ✓ ${todoId} already completed (${result.planPath})`);
  }
}

main();
