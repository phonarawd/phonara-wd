import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { markPlanTodoCompleted } from '../scripts/lib/plan-todo-closeout';

const FIXTURE = `---
name: test-plan
todos:
  - id: todo-a
    content: "first"
    status: pending
  - id: todo-b
    content: "second"
    status: completed
isProject: false
---

# body
`;

describe('plan-todo-closeout', () => {
  let dir = '';
  let planPath = '';

  afterEach(() => {
    dir = '';
    planPath = '';
  });

  it('marks pending todo completed', () => {
    dir = mkdtempSync(join(tmpdir(), 'phonara-plan-'));
    planPath = join(dir, 'test.plan.md');
    writeFileSync(planPath, FIXTURE, 'utf8');

    const result = markPlanTodoCompleted(planPath, 'todo-a');
    expect(result.changed).toBe(true);
    expect(result.previousStatus).toBe('pending');

    const text = readFileSync(planPath, 'utf8');
    expect(text).toMatch(/id: todo-a[\s\S]*status: completed/);
  });

  it('is idempotent when already completed', () => {
    dir = mkdtempSync(join(tmpdir(), 'phonara-plan-'));
    planPath = join(dir, 'test.plan.md');
    writeFileSync(planPath, FIXTURE, 'utf8');

    const first = markPlanTodoCompleted(planPath, 'todo-a');
    const second = markPlanTodoCompleted(planPath, 'todo-a');
    expect(first.changed).toBe(true);
    expect(second.changed).toBe(false);
  });
});
