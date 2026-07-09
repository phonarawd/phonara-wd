import { readFileSync } from 'node:fs';

export type PlanTodoStatus = 'completed' | 'pending' | 'cancelled';

export interface PlanTodo {
  id: string;
  status: PlanTodoStatus;
  content: string;
}

/** Cursor UI may set `in_progress` mid-session — treat as pending for counts/gates. */
export function normalizePlanTodoStatus(raw: string): PlanTodoStatus | null {
  const s = raw.trim();
  if (s === 'completed' || s === 'pending' || s === 'cancelled') return s;
  if (s === 'in_progress') return 'pending';
  return null;
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

    const statusMatch = line.match(/^\s+status:\s*(\S+)/);
    if (statusMatch) {
      const normalized = normalizePlanTodoStatus(statusMatch[1]);
      if (!normalized) {
        throw new Error(`todo "${current.id}": unknown status "${statusMatch[1]}"`);
      }
      current.status = normalized;
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
