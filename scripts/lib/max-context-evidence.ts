import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cursorUserSettingsPath } from './cursor-cold-start-settings';

export type MaxContextValue = '6k' | '200k' | 'unknown';

export type MaxContextStatus = 'pass' | 'fail' | 'ambiguous';

export interface MaxContextEvidence {
  max_context: MaxContextValue;
  verified_at: string;
  method: string;
  ttl_days?: number;
}

export const MAX_CONTEXT_EVIDENCE_TTL_DAYS = 7;

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function perfArtifactsDir(): string {
  return path.join(REPO_ROOT, '.cursor', 'perf');
}

export function maxContextEvidencePath(): string {
  return path.join(perfArtifactsDir(), 'max-context-evidence.json');
}

const MAX_CONTEXT_SETTING_KEY_HINTS = [
  'cursor.agent.maxContext',
  'cursor.chat.maxContext',
  'cursor.agent.maxAllowedContext',
  'cursor.maxContext',
  'cursor.maxContextTokens',
  'agents.maxContext',
  'chat.agent.maxContext',
] as const;

export function normalizeMaxContextToken(raw: unknown): MaxContextValue | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    if (raw >= 150_000) return '200k';
    if (raw <= 8_000) return '6k';
    return null;
  }
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().toLowerCase();
  if (trimmed === '6k' || trimmed === '6000' || trimmed === '8k') return '6k';
  if (trimmed === '200k' || trimmed === '200000' || trimmed === '1m' || trimmed === '1000000') {
    return '200k';
  }
  const asNumber = Number.parseInt(trimmed.replace(/[^\d]/g, ''), 10);
  if (Number.isFinite(asNumber)) {
    if (asNumber >= 150_000) return '200k';
    if (asNumber <= 8_000) return '6k';
  }
  return null;
}

function walkSettingsForMaxContext(value: unknown, keyPath = ''): MaxContextValue | null {
  const direct = normalizeMaxContextToken(value);
  if (direct) {
    const lowerKey = keyPath.toLowerCase();
    if (lowerKey.includes('context') || lowerKey.includes('maxcontext')) {
      return direct;
    }
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = walkSettingsForMaxContext(item, keyPath);
      if (found) return found;
    }
    return null;
  }

  if (value && typeof value === 'object') {
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      const nextPath = keyPath ? `${keyPath}.${key}` : key;
      if (MAX_CONTEXT_SETTING_KEY_HINTS.some((hint) => hint === nextPath)) {
        const hinted = normalizeMaxContextToken(nested);
        if (hinted) return hinted;
      }
      const found = walkSettingsForMaxContext(nested, nextPath);
      if (found) return found;
    }
  }

  return null;
}

export function readCursorUserSettingsRecord(): Record<string, unknown> | null {
  const filePath = cursorUserSettingsPath();
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function readMaxContextFromSettings(): MaxContextValue | null {
  const settings = readCursorUserSettingsRecord();
  if (!settings) return null;
  return walkSettingsForMaxContext(settings);
}

export function ageDays(iso: string): number {
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) return Number.POSITIVE_INFINITY;
  return (Date.now() - parsed) / (24 * 60 * 60 * 1000);
}

export function isEvidenceValid(evidence: MaxContextEvidence): boolean {
  if (evidence.max_context !== '6k') return false;
  const ttlDays = evidence.ttl_days ?? MAX_CONTEXT_EVIDENCE_TTL_DAYS;
  return ageDays(evidence.verified_at) <= ttlDays;
}

export function readMaxContextEvidence(): MaxContextEvidence | null {
  const filePath = maxContextEvidencePath();
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, 'utf8')) as MaxContextEvidence;
  } catch {
    return null;
  }
}

export function writeMaxContextEvidence(evidence: MaxContextEvidence): string {
  const dir = perfArtifactsDir();
  mkdirSync(dir, { recursive: true });
  const filePath = maxContextEvidencePath();
  writeFileSync(filePath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  return filePath;
}

export function resolveMaxContextStatus(options?: { attestMaxContext?: MaxContextValue | null }): {
  status: MaxContextStatus;
  source: 'settings' | 'evidence' | 'attest' | 'none';
  max_context: MaxContextValue;
} {
  const settingsValue = readMaxContextFromSettings();
  if (settingsValue === '200k') {
    return { status: 'fail', source: 'settings', max_context: '200k' };
  }
  if (settingsValue === '6k') {
    return { status: 'pass', source: 'settings', max_context: '6k' };
  }

  if (options?.attestMaxContext === '6k') {
    return { status: 'pass', source: 'attest', max_context: '6k' };
  }

  const evidence = readMaxContextEvidence();
  if (evidence && isEvidenceValid(evidence)) {
    return { status: 'pass', source: 'evidence', max_context: '6k' };
  }

  return { status: 'ambiguous', source: 'none', max_context: 'unknown' };
}
