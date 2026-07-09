/**
 * Restore Presentation reference docs from all agent transcripts.
 * Write + full-file StrReplace on presentation archive docs → docs/archive/presentation-zenith-reference/
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';

const TRANSCRIPT_ROOT = join(
  process.env.USERPROFILE ?? '',
  '.cursor/projects/c-Users-PC-Desktop-phonara-gb/agent-transcripts',
);

const OUT_DIR = join(process.cwd(), 'docs/archive/presentation-zenith-reference');

const TARGET_NAMES = new Set([
  'PRESENTATION_ZENITH_BOOTSTRAP_PASTE.md',
  'PRESENTATION_ZENITH_NEW_CHAT_PASTE.md',
  'PRESENTATION_ZENITH_ROADMAP.md',
  'PRESENTATION_ZENITH_PHASE12_B_EXECUTE_PASTE.md',
  'PRESENTATION_ZENITH_PHASE12_C_EXECUTE_PASTE.md',
  'PRESENTATION_ZENITH_PHASE12_D_EXECUTE_PASTE.md',
  'PRESENTATION_ZENITH_PHASE12_D_EXECUTE_REPLY.md',
  'PRESENTATION_ZENITH_PHASE12_D_AMEND_GO.md',
  'PRESENTATION_ZENITH_PHASE12_D_AMEND_GO_2.md',
  'PRESENTATION_ZENITH_PHASE12_D_V011_LOCK.md',
  'PRESENTATION_ZENITH_PHASE12_D_V011_EXECUTE_PASTE.md',
  'PRESENTATION_ZENITH_PHASE12_F_LOCK.md',
  'PRESENTATION_ZENITH_PHASE12_F_EXECUTE_PASTE.md',
  'PRESENTATION_ZENITH_PHASE12_FINAL_EXECUTE_PASTE.md',
]);

type Entry = { contents: string; source: string; line: number; kind: string };

function normalizePath(p: string): string {
  return p.replace(/\\/g, '/');
}

function isArchivePresentationDoc(norm: string): boolean {
  return norm.includes('docs/PRESENTATION') || norm.endsWith('PRESENTATION_ZENITH_ROADMAP.md');
}

function listTranscripts(): string[] {
  const out: string[] = [];
  if (!existsSync(TRANSCRIPT_ROOT)) return out;
  for (const dir of readdirSync(TRANSCRIPT_ROOT)) {
    const p = join(TRANSCRIPT_ROOT, dir, `${dir}.jsonl`);
    if (existsSync(p)) out.push(p);
  }
  return out;
}

function extractFromTranscript(filePath: string): Map<string, Entry> {
  const files = new Map<string, Entry>();
  const raw = readFileSync(filePath, 'utf8');
  let lineNo = 0;
  const tag = basename(filePath, '.jsonl');

  for (const line of raw.split('\n')) {
    lineNo += 1;
    if (!line.trim()) continue;
    let obj: { role?: string; message?: { content?: unknown[] } };
    try {
      obj = JSON.parse(line) as typeof obj;
    } catch {
      continue;
    }
    if (obj.role !== 'assistant') continue;

    for (const part of obj.message?.content ?? []) {
      if (typeof part !== 'object' || part === null) continue;
      const p = part as { type?: string; name?: string; input?: Record<string, string> };
      if (p.type !== 'tool_use') continue;
      const inp = p.input;
      if (!inp?.path) continue;
      const norm = normalizePath(inp.path);
      if (!isArchivePresentationDoc(norm)) continue;
      const name = basename(norm);
      if (!TARGET_NAMES.has(name)) continue;

      if (p.name === 'Write' && inp.contents) {
        files.set(name, {
          contents: inp.contents,
          source: `${tag}:L${lineNo}`,
          line: lineNo,
          kind: 'Write',
        });
      }

      if (p.name === 'StrReplace' && inp.new_string) {
        const ns = inp.new_string;
        const looksFull =
          ns.startsWith('# Presentation') ||
          ns.startsWith('# Phase 12') ||
          ns.startsWith('---BEGIN---') ||
          (ns.includes('---BEGIN---') && ns.length > 2000) ||
          (name === 'PRESENTATION_ZENITH_ROADMAP.md' && ns.length > 10000);

        if (looksFull) {
          const prev = files.get(name);
          if (!prev || ns.length >= prev.contents.length) {
            files.set(name, {
              contents: ns,
              source: `${tag}:L${lineNo}`,
              line: lineNo,
              kind: 'StrReplace-full',
            });
          }
        }
      }
    }
  }

  return files;
}

function mergeMaps(maps: Map<string, Entry>[]): Map<string, Entry> {
  const merged = new Map<string, Entry>();
  for (const m of maps) {
    for (const [name, entry] of m) {
      const prev = merged.get(name);
      if (!prev || entry.contents.length > prev.contents.length) {
        merged.set(name, entry);
      }
    }
  }
  return merged;
}

function copyLiveDocs(): void {
  const live = join(process.cwd(), 'docs');
  const alsoCopy = [
    'PRESENTATION_ZENITH_PHASE12_B_LOCK.md',
    'PRESENTATION_ZENITH_PHASE12_C_LOCK.md',
    'PRESENTATION_ZENITH_PHASE12_D_LOCK.md',
    'PRESENTATION_ZENITH_PHASE12_E_LOCK.md',
    'PRESENTATION_ZENITH_PHASE12_F2_LOCK.md',
    'PRESENTATION_ZENITH_PHASE12_F2_EXECUTE_PASTE.md',
    'PRESENTATION_ZENITH_PHASE12_A_LOCK.md',
    'PRESENTATION_ZENITH_PHASE12_A_EXECUTE_PASTE.md',
    'PRESENTATION_ZENITH_PHASE12_G_LOCK.md',
    'PRESENTATION_ZENITH_PHASE12_G_EXECUTE_PASTE.md',
    'PRESENTATION_ZENITH_PHASE12_H_THEME_LOCK.md',
  ];
  for (const name of alsoCopy) {
    const src = join(live, name);
    if (existsSync(src)) {
      writeFileSync(join(OUT_DIR, name), readFileSync(src, 'utf8'), 'utf8');
      console.log(`COPY live ${name}`);
    }
  }
}

function main(): void {
  mkdirSync(OUT_DIR, { recursive: true });

  const transcripts = listTranscripts();
  console.log('Transcripts:', transcripts.length);

  const maps = transcripts.map(extractFromTranscript);
  const merged = mergeMaps(maps);

  for (const name of TARGET_NAMES) {
    const entry = merged.get(name);
    if (!entry) {
      console.warn('MISSING:', name);
      continue;
    }
    writeFileSync(join(OUT_DIR, name), entry.contents, 'utf8');
    console.log(`OK ${name} (${entry.contents.length} chars · ${entry.kind} · ${entry.source})`);
  }

  copyLiveDocs();

  const readme = `# Presentation Zenith — 참고 아카이브 (Cursor 이식용)

> **용도:** Presentation EXECUTE/amend/ROADMAP **상세 본문** 보관. Cursor paste·wire 작업 시 LOCK과 함께 참고.
> **정본 탐색(운영):** [\`../PRESENTATION_ZENITH_INDEX.md\`](../PRESENTATION_ZENITH_INDEX.md) · [\`../PRESENTATION_ZENITH_NEW_CHAT.md\`](../PRESENTATION_ZENITH_NEW_CHAT.md)

## 복구 출처

- agent transcript \`Write\` / full \`StrReplace\` 스냅샷 (최장본 per file)
- 현행 LOCK/EXECUTE는 \`docs/\`에서 mirror copy

## 파일 목록

| 파일 | 용도 |
|------|------|
| \`NEW_CHAT_PASTE.md\` | Presentation 새 채팅 historical 복붙 블록 |
| \`PHASE12_*_EXECUTE_PASTE.md\` | 슬라이스 EXECUTE Step 0→10 · bash gate |
| \`D_AMEND_GO*.md\` · \`D_V011_*\` | 12-D amend · v0.1.1 route split |
| \`F_*\` · \`FINAL_EXECUTE_PASTE\` | 12-F (F2 이전) · 병렬 chain |
| \`ROADMAP.md\` | Phase 0–11 §GREEN 이력 (가능한 최장본) |
| \`*_LOCK.md\` · \`F2_*\` · \`A/G/H_*\` | 현행 정본 mirror |

**PHONARA paste:** LOCK §GREEN + 이 폴더 EXECUTE bash 블록 + \`F2_EXECUTE_PASTE\` (현행).

*scripts/restore-docs-from-transcript.ts*
`;

  writeFileSync(join(OUT_DIR, 'README.md'), readme, 'utf8');
  console.log('\nArchive:', OUT_DIR);
  console.log('Restored', merged.size, '/', TARGET_NAMES.size, 'from transcripts');
}

main();
