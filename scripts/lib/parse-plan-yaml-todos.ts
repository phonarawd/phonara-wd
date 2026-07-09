import { readFileSync } from 'node:fs';

export interface PlanTodo {
  id: string;
  status: 'completed' | 'pending' | 'cancelled';
  content: string;
}

export function parsePlanYamlTodos(planPath: string): PlanTodo[] {
  const raw = readFileSync(planPath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const fmStart = lines.findIndex((l) => l.trim() === '---');
  const fmEnd = lines.findIndex((l, i) => i > fmStart && l.trim() === '---');
  if (fmStart === -1 || fmEnd === -1) {
    throw new Error('frontmatter 블록을 찾을 수 없음');
  }

  const entries: PlanTodo[] = [];
  let current: Partial<PlanTodo> = {};
  let inContent = false;
  let contentBuffer = '';

  const flush = () => {
    if (!current.id) return;
    if (!current.status) {
      throw new Error(`todo "${current.id}": status 누락`);
    }
    current.content = contentBuffer;
    entries.push(current as PlanTodo);
    current = {};
    contentBuffer = '';
    inContent = false;
  };

  for (const line of lines.slice(fmStart + 1, fmEnd)) {
    const idMatch = line.match(/^\s+- id:\s*(.+)$/);
    if (idMatch) {
      flush();
      current = { id: idMatch[1].trim() };
      continue;
    }

    const contentStartMatch = line.match(/^\s+content:\s*"(.*)$/);
    if (contentStartMatch) {
      contentBuffer = contentStartMatch[1];
      if (contentBuffer.endsWith('"')) {
        contentBuffer = contentBuffer.slice(0, -1);
        inContent = false;
      } else {
        inContent = true;
      }
      continue;
    }
    if (inContent) {
      if (line.trim().endsWith('"')) {
        contentBuffer += '\n' + line.replace(/"\s*$/, '');
        inContent = false;
      } else {
        contentBuffer += '\n' + line;
      }
      continue;
    }

    const statusMatch = line.match(/^\s+status:\s*(completed|pending|cancelled)/);
    if (statusMatch) {
      current.status = statusMatch[1] as PlanTodo['status'];
    }
  }
  flush();
  return entries;
}

export function summarizePlanTodos(todos: PlanTodo[]) {
  const completed = todos.filter((t) => t.status === 'completed').length;
  const pending = todos.filter((t) => t.status === 'pending').length;
  const cancelled = todos.filter((t) => t.status === 'cancelled').length;
  const trackB = todos.filter((t) => t.id.startsWith('ew-')).length;
  const trackA = todos.length - trackB;
  const firstPending = todos.find((t) => t.status === 'pending');
  const firstPendingIndex = firstPending ? todos.indexOf(firstPending) + 1 : null;

  return {
    ids: todos.length,
    completed,
    pending,
    cancelled,
    active: todos.length - cancelled,
    trackA,
    trackB,
    firstPendingId: firstPending?.id ?? null,
    firstPendingIndex,
  };
}
