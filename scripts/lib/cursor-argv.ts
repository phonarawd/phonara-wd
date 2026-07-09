import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { cursorAppDataRoot } from './cursor-metadata-sizes';

/** PHONARA Cursor argv contract — merge-only; never delete unknown keys. */
export const PHONARA_CURSOR_ARGV_DEFAULTS = {
  'max-memory': 4096,
  'enable-low-end-device-mode': true,
  'disable-hardware-acceleration': true,
} as const;

export type PhonaraCursorArgvKey = keyof typeof PHONARA_CURSOR_ARGV_DEFAULTS;

export type CursorArgvDrift = {
  key: PhonaraCursorArgvKey;
  expected: (typeof PHONARA_CURSOR_ARGV_DEFAULTS)[PhonaraCursorArgvKey];
  actual: unknown;
};

export type CursorArgvAudit = {
  path: string;
  exists: boolean;
  missing: PhonaraCursorArgvKey[];
  drift: CursorArgvDrift[];
  ok: boolean;
};

export function cursorArgvPath(): string {
  return path.join(cursorAppDataRoot(), 'argv.json');
}

export function readCursorArgvRecord(): Record<string, unknown> {
  const filePath = cursorArgvPath();
  if (!existsSync(filePath)) return {};
  try {
    return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function auditCursorArgv(): CursorArgvAudit {
  const filePath = cursorArgvPath();
  const current = readCursorArgvRecord();
  const missing: PhonaraCursorArgvKey[] = [];
  const drift: CursorArgvDrift[] = [];

  for (const key of Object.keys(PHONARA_CURSOR_ARGV_DEFAULTS) as PhonaraCursorArgvKey[]) {
    const expected = PHONARA_CURSOR_ARGV_DEFAULTS[key];
    if (!(key in current)) {
      missing.push(key);
      continue;
    }
    if (current[key] !== expected) {
      drift.push({ key, expected, actual: current[key] });
    }
  }

  return {
    path: filePath,
    exists: existsSync(filePath),
    missing,
    drift,
    ok: missing.length === 0 && drift.length === 0,
  };
}

export type MergeCursorArgvResult = CursorArgvAudit & {
  applied: boolean;
  changed: boolean;
  hadMissingKeys: boolean;
};

/** Merge PHONARA defaults into argv.json. Preserves keys not in the contract. */
export function mergeCursorArgv(options?: { apply?: boolean }): MergeCursorArgvResult {
  const apply = options?.apply ?? false;
  const before = auditCursorArgv();
  const hadMissingKeys = before.missing.length > 0;
  const current = readCursorArgvRecord();
  const merged: Record<string, unknown> = { ...current, ...PHONARA_CURSOR_ARGV_DEFAULTS };
  const serialized = `${JSON.stringify(merged, null, 2)}\n`;
  const priorSerialized = existsSync(before.path) ? readFileSync(before.path, 'utf8') : '';
  const changed = serialized !== priorSerialized;

  if (apply && changed) {
    writeFileSync(before.path, serialized, 'utf8');
  }

  const after = apply && changed ? auditCursorArgv() : before;

  return {
    ...after,
    applied: apply && changed,
    changed,
    hadMissingKeys,
  };
}

export function formatCursorArgvStatusLine(audit: CursorArgvAudit): string {
  if (audit.ok) {
    return '[cursor:argv] render contract OK (max-memory + disable-hardware-acceleration)';
  }
  const parts: string[] = [];
  if (audit.missing.length > 0) {
    parts.push(`missing: ${audit.missing.join(', ')}`);
  }
  if (audit.drift.length > 0) {
    parts.push(
      `drift: ${audit.drift.map((d) => `${d.key}=${JSON.stringify(d.actual)}`).join(', ')}`,
    );
  }
  return `[cursor:argv] WARN render contract — ${parts.join(' · ')} — run: bun run cursor:render-fix`;
}
