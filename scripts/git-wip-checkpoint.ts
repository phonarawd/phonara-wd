/**
 * Safe WIP checkpoint commit — unfinished work is OK on wip/* branches.
 * Squash-merge to main when the slice is GREEN.
 */
import { spawnSync } from 'node:child_process';
import {
  assertOnWipBranch,
  currentBranch,
  git,
  parseStatusLines,
  pathMatchesSlice,
  WIP_SLICES,
  type WipSliceId,
} from './lib/git-wip';

function gitCommit(message: string): void {
  const result = spawnSync('git', ['commit', '-m', message], { encoding: 'utf8' });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || '[wip:checkpoint] git commit failed\n');
    process.exit(result.status ?? 1);
  }
  if (result.stdout?.trim()) process.stdout.write(result.stdout);
}

function parseArgs(argv: string[]): { slice?: WipSliceId; message: string } {
  let slice: WipSliceId | undefined;
  const rest: string[] = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--slice' && argv[i + 1]) {
      const id = argv[i + 1] as WipSliceId;
      if (!WIP_SLICES.some((s) => s.id === id)) {
        process.stderr.write(
          `[wip:checkpoint] unknown slice "${id}". Use: trade|home|shell|i18n|tooling\n`,
        );
        process.exit(1);
      }
      slice = id;
      i += 1;
      continue;
    }
    rest.push(arg);
  }

  const message = rest.join(' ').trim();
  if (!message) {
    process.stderr.write('[wip:checkpoint] usage: bun run wip:checkpoint -- "milestone note"\n');
    process.stderr.write('  bun run wip:checkpoint -- --slice trade "mobile tab bar layout"\n');
    process.exit(1);
  }

  return { slice, message };
}

const { slice, message } = parseArgs(process.argv.slice(2));
const branch = currentBranch();
assertOnWipBranch(branch);

const before = parseStatusLines();
if (before.length === 0) {
  process.stdout.write('[wip:checkpoint] nothing to commit — working tree already clean\n');
  process.exit(0);
}

if (slice) {
  const def = WIP_SLICES.find((s) => s.id === slice)!;
  const matched = before.filter((line) => pathMatchesSlice(line.path, def.paths));
  if (matched.length === 0) {
    process.stderr.write(`[wip:checkpoint] no changes in slice "${slice}"\n`);
    process.exit(1);
  }
  for (const line of matched) {
    git(`add -- ${quotePath(line.path)}`);
  }
  process.stdout.write(`[wip:checkpoint] staged ${matched.length} file(s) in slice "${slice}"\n`);
} else {
  git('add -A');
  process.stdout.write(`[wip:checkpoint] staged all ${before.length} changed path(s)\n`);
}

const scope = slice ?? 'ui';
const commitMsg = `wip(${scope}): ${message}`;

gitCommit(commitMsg);

const after = parseStatusLines();
process.stdout.write(`[wip:checkpoint] committed on ${branch}\n`);
process.stdout.write(`[wip:checkpoint] remaining dirty paths: ${after.length}\n`);
if (after.length === 0) {
  process.stdout.write('[wip:checkpoint] working tree clean — Cursor git/tsserver load reduced\n');
}

function quotePath(p: string): string {
  if (/[\s"]/.test(p)) return `"${p.replace(/"/g, '\\"')}"`;
  return p;
}
