/**
 * Grouped git status for large WIP trees — reduces noise vs raw `git status`.
 */
import { classifyStatus, currentBranch, git, parseStatusLines, WIP_SLICES } from './lib/git-wip';

const branch = currentBranch();
const lines = parseStatusLines();
const buckets = classifyStatus(lines);

process.stdout.write(`[wip:status] branch=${branch}\n`);

if (lines.length === 0) {
  process.stdout.write('[wip:status] working tree clean — tsserver/git diff load minimal\n');
  process.exit(0);
}

const modified = lines.filter((l) => l.code.trim() === 'M' || l.code.includes('M')).length;
const untracked = lines.filter((l) => l.code.includes('?')).length;
process.stdout.write(
  `[wip:status] ${lines.length} path(s) — modified ${modified}, untracked ${untracked}\n`,
);

for (const slice of WIP_SLICES) {
  const items = buckets.get(slice.id) ?? [];
  if (items.length === 0) continue;
  process.stdout.write(`\n[${slice.label}] ${items.length} file(s)\n`);
  for (const item of items.slice(0, 8)) {
    process.stdout.write(`  ${item.code} ${item.path}\n`);
  }
  if (items.length > 8) {
    process.stdout.write(`  … +${items.length - 8} more\n`);
  }
}

const other = buckets.get('other') ?? [];
if (other.length > 0) {
  process.stdout.write(`\n[Other] ${other.length} file(s)\n`);
  for (const item of other.slice(0, 6)) {
    process.stdout.write(`  ${item.code} ${item.path}\n`);
  }
  if (other.length > 6) {
    process.stdout.write(`  … +${other.length - 6} more\n`);
  }
}

try {
  git('rev-parse --verify origin/main');
  const counts = git('rev-list --left-right --count origin/main...HEAD');
  const [behind, ahead] = counts.split(/\s+/);
  process.stdout.write(`\n[wip:status] vs origin/main: ahead ${ahead}, behind ${behind}\n`);
} catch {
  // origin/main may be unavailable offline — non-fatal.
}

process.stdout.write('\nNext (work unfinished OK):\n');
process.stdout.write('  bun run wip:checkpoint -- "slice milestone note"\n');
process.stdout.write('  bun run wip:checkpoint -- --slice trade "mobile tab bar"\n');
