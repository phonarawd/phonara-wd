#!/usr/bin/env node
/**
 * check-plan-yaml.ts (v1.0.1)
 * Usage:
 *   bun run check:plan-yaml -- "<path>"                 # Track A + B 전체 검사
 *   bun run check:plan-yaml -- "<path>" --track-a-only   # Track A만 order-violation 게이트
 * Exit code: 0 = PASS, 1 = FAIL
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface TodoEntry {
  id: string;
  status: 'completed' | 'pending' | 'cancelled';
  content: string;
  precedesTokens: string[];
}

interface PrecedeCheck {
  fromId: string;
  token: string;
  resolvedIds: string[];
  matchKind: 'exact' | 'prefix' | 'unresolved';
  violated: boolean;
  track: 'A' | 'B';
}

function parseFrontmatter(planPath: string): TodoEntry[] {
  const raw = readFileSync(planPath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const fmStart = lines.findIndex((l) => l.trim() === '---');
  const fmEnd = lines.findIndex((l, i) => i > fmStart && l.trim() === '---');
  if (fmStart === -1 || fmEnd === -1) throw new Error('frontmatter 블록을 찾을 수 없음');

  const entries: TodoEntry[] = [];
  let current: Partial<TodoEntry> = {};
  let inContent = false;
  let contentBuffer = '';

  const flush = () => {
    if (!current.id) return;
    if (!current.status) {
      throw new Error(`todo "${current.id}": status 누락 — frontmatter 확인 필요`);
    }
    current.content = contentBuffer;
    current.precedesTokens = extractPrecedesTokens(contentBuffer);
    entries.push(current as TodoEntry);
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
      current.status = statusMatch[1] as TodoEntry['status'];
    }
  }
  flush();
  return entries;
}

function extractPrecedesTokens(content: string): string[] {
  const match = content.match(/선행:([a-z0-9][a-z0-9-]*(?:\+[a-z0-9][a-z0-9-]*)*)/);
  return match ? match[1].split('+').map((t) => t.trim()) : [];
}

function resolveToken(token: string, ids: string[], idIndex: Map<string, number>) {
  if (idIndex.has(token)) return { resolvedIds: [token], matchKind: 'exact' as const };
  const prefixMatches = ids.filter((id) => id.startsWith(`${token}-`) || id === token);
  if (prefixMatches.length > 0) return { resolvedIds: prefixMatches, matchKind: 'prefix' as const };
  return { resolvedIds: [], matchKind: 'unresolved' as const };
}

function reconcile(entries: TodoEntry[]) {
  const ids = entries.map((e) => e.id);
  const completed = entries.filter((e) => e.status === 'completed').length;
  const pending = entries.filter((e) => e.status === 'pending').length;
  const cancelled = entries.filter((e) => e.status === 'cancelled').length;

  const counts = ids.reduce<Record<string, number>>((a, id) => ((a[id] = (a[id] || 0) + 1), a), {});
  const duplicates = Object.entries(counts).filter(([, n]) => n > 1);

  const trackB = ids.filter((id) => id.startsWith('ew-')).length;
  const trackA = ids.length - trackB;

  const idIndex = new Map(ids.map((id, i) => [id, i]));
  const precedeChecks: PrecedeCheck[] = [];
  const unresolvedPrecedes: string[] = [];

  for (const entry of entries) {
    const selfIdx = idIndex.get(entry.id)!;
    const track: 'A' | 'B' = entry.id.startsWith('ew-') ? 'B' : 'A';
    for (const token of entry.precedesTokens) {
      const { resolvedIds, matchKind } = resolveToken(token, ids, idIndex);
      if (matchKind === 'unresolved') {
        unresolvedPrecedes.push(`${entry.id} → 선행:${token} (해석 불가)`);
        continue;
      }
      const referenceIdx = Math.max(...resolvedIds.map((id) => idIndex.get(id)!));
      precedeChecks.push({
        fromId: entry.id,
        token,
        resolvedIds,
        matchKind,
        violated: referenceIdx > selfIdx,
        track,
      });
    }
  }

  return {
    ids,
    completed,
    pending,
    cancelled,
    sum: completed + pending + cancelled,
    trackA,
    trackB,
    duplicates,
    precedeChecks,
    unresolvedPrecedes,
  };
}

function main() {
  const args = process.argv.slice(2);
  const planPath = args.find((a) => !a.startsWith('--'));
  const trackAOnly = args.includes('--track-a-only');
  if (!planPath) {
    console.error('Usage: check-plan-yaml.ts <path> [--track-a-only]');
    process.exit(1);
  }

  const entries = parseFrontmatter(resolve(planPath));
  const result = reconcile(entries);

  const violationsInScope = result.precedeChecks.filter(
    (c) => c.violated && (!trackAOnly || c.track === 'A'),
  );
  const violationsOutOfScope = result.precedeChecks.filter(
    (c) => c.violated && trackAOnly && c.track === 'B',
  );

  console.log(
    JSON.stringify(
      {
        ids: result.ids.length,
        completed: result.completed,
        pending: result.pending,
        cancelled: result.cancelled,
        sum: result.sum,
        trackA: result.trackA,
        trackB: result.trackB,
        dup: result.duplicates.length ? result.duplicates : 'none',
        scope: trackAOnly ? 'track-a-only' : 'all',
        orderViolations: violationsInScope.length
          ? violationsInScope.map((v) => `${v.fromId} 선행 위반: ${v.token} (${v.matchKind})`)
          : 'none',
        deferredTrackBViolations: violationsOutOfScope.length,
        unresolvedPrecedes: result.unresolvedPrecedes.length ? result.unresolvedPrecedes : 'none',
      },
      null,
      2,
    ),
  );

  const failures: string[] = [];
  if (result.sum !== result.ids.length) failures.push('sum !== ids.length');
  if (result.duplicates.length > 0) failures.push(`중복 id: ${JSON.stringify(result.duplicates)}`);
  if (result.trackA + result.trackB !== result.ids.length) failures.push('Track A+B 합 불일치');
  if (violationsInScope.length > 0) {
    failures.push(
      `선행 위반 ${violationsInScope.length}건 (scope: ${trackAOnly ? 'Track A' : 'all'})`,
    );
  }

  if (trackAOnly && violationsOutOfScope.length > 0) {
    console.warn(
      `\n⚠️  Track B 선행 위반 ${violationsOutOfScope.length}건 — v1.1로 defer (게이트 미포함)`,
    );
  }
  if (result.unresolvedPrecedes.length > 0) {
    console.warn('\n⚠️  해석 불가 선행 토큰:', result.unresolvedPrecedes);
  }

  if (failures.length > 0) {
    console.error('\n❌ FAIL:', failures);
    process.exit(1);
  }
  console.log('\n✅ PASS');
  process.exit(0);
}

main();
