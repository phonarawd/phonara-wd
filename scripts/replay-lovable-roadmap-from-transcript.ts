/**
 * Replay StrReplace/Write ops on LOVABLE_ZENITH_ROADMAP.md from agent transcripts.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

const TRANSCRIPT_ROOT = join(
  process.env.USERPROFILE ?? '',
  '.cursor/projects/c-Users-PC-Desktop-phonara-gb/agent-transcripts',
);

const OUT = join(process.cwd(), 'docs/archive/lovable-zenith-reference/LOVABLE_ZENITH_ROADMAP.full.md');

type Op =
  | { kind: 'Write'; contents: string; ts: number; line: number; tag: string }
  | { kind: 'StrReplace'; old: string; new: string; ts: number; line: number; tag: string };

function listTranscripts(): { path: string; mtime: number }[] {
  const out: { path: string; mtime: number }[] = [];
  for (const dir of readdirSync(TRANSCRIPT_ROOT)) {
    const p = join(TRANSCRIPT_ROOT, dir, `${dir}.jsonl`);
    if (existsSync(p)) out.push({ path: p, mtime: statSync(p).mtimeMs });
  }
  return out.sort((a, b) => a.mtime - b.mtime);
}

function collectOps(filePath: string, mtime: number): Op[] {
  const ops: Op[] = [];
  const tag = basename(filePath, '.jsonl');
  let lineNo = 0;
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
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
      if (!inp?.path?.replace(/\\/g, '/').includes('LOVABLE_ZENITH_ROADMAP.md')) continue;

      if (p.name === 'Write' && inp.contents) {
        ops.push({ kind: 'Write', contents: inp.contents, ts: mtime, line: lineNo, tag });
      }
      if (p.name === 'StrReplace' && inp.new_string !== undefined) {
        ops.push({
          kind: 'StrReplace',
          old: inp.old_string ?? '',
          new: inp.new_string,
          ts: mtime,
          line: lineNo,
          tag,
        });
      }
    }
  }
  return ops;
}

function apply(ops: Op[]): { text: string; applied: number; failed: number } {
  let text = '';
  let applied = 0;
  let failed = 0;

  for (const op of ops) {
    if (op.kind === 'Write') {
      text = op.contents;
      applied += 1;
      continue;
    }
    if (!op.old) {
      if (!text) text = op.new;
      else failed += 1;
      continue;
    }
    if (text.includes(op.old)) {
      text = text.replace(op.old, op.new);
      applied += 1;
    } else {
      failed += 1;
    }
  }

  return { text, applied, failed };
}

function main(): void {
  const transcripts = listTranscripts();
  const allOps: Op[] = [];
  for (const t of transcripts) {
    allOps.push(...collectOps(t.path, t.mtime));
  }
  allOps.sort((a, b) => (a.ts !== b.ts ? a.ts - b.ts : a.line - b.line));

  const { text, applied, failed } = apply(allOps);
  writeFileSync(OUT, text, 'utf8');

  console.log('Ops total:', allOps.length);
  console.log('Applied:', applied, 'Failed:', failed);
  console.log('Output chars:', text.length, 'lines:', text.split('\n').length);
  console.log('Wrote', OUT);
}

main();
