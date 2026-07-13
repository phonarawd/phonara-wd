#!/usr/bin/env tsx
/**
 * GitHub Actions run hygiene — delete failed/cancelled noise; keep latest green runs.
 * World-class default: keep 1 latest success per workflow, prune the rest.
 *
 * Usage:
 *   bun run ci:prune-runs              # dry-run preview
 *   bun run ci:prune-runs -- --apply   # delete
 *   bun run ci:prune-runs -- --apply --keep-success 3
 */
import { spawnSync } from 'node:child_process';
import { gitRemoteRepoOrExit } from './lib/git-remote-repo';

type RunRow = {
  id: number;
  conclusion: string | null;
  created_at: string;
  head_branch: string;
  event: string;
};

function parseArgs(argv: string[]): { apply: boolean; keepSuccess: number; repo?: string } {
  let apply = false;
  let keepSuccess = 1;
  let repo: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--apply') apply = true;
    else if (a === '--keep-success') keepSuccess = Math.max(1, Number(argv[++i] ?? 1));
    else if (a === '--repo') repo = argv[++i];
  }
  return { apply, keepSuccess, repo };
}

function ghDelete(repo: string, runId: number): boolean {
  const r = spawnSync('gh', ['api', '--method', 'DELETE', `repos/${repo}/actions/runs/${runId}`], {
    encoding: 'utf8',
  });
  return r.status === 0;
}

function listRuns(repo: string): RunRow[] {
  const r = spawnSync(
    'gh',
    [
      'api',
      `repos/${repo}/actions/runs?per_page=100`,
      '--paginate',
      '-q',
      '.workflow_runs[] | {id, conclusion, created_at, head_branch, event}',
    ],
    { encoding: 'utf8' },
  );
  if (r.status !== 0) {
    throw new Error((r.stderr ?? r.stdout ?? 'gh failed').trim());
  }
  const text = (r.stdout ?? '').trim();
  if (!text) return [];
  return text
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as RunRow);
}

function pickDeletes(runs: RunRow[], keepSuccess: number): { keep: RunRow[]; delete: RunRow[] } {
  const sorted = [...runs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const successes = sorted.filter((r) => r.conclusion === 'success');
  const keep = successes.slice(0, keepSuccess);
  const keepIds = new Set(keep.map((r) => r.id));
  const toDelete = sorted.filter((r) => !keepIds.has(r.id));
  return { keep, delete: toDelete };
}

const { apply, keepSuccess, repo: repoArg } = parseArgs(process.argv.slice(2));
const repo = repoArg ?? gitRemoteRepoOrExit();

process.stdout.write('=== PHONARA Actions hygiene ===\n\n');
process.stdout.write(`Repository:   ${repo}\n`);
process.stdout.write(`Keep success: ${keepSuccess} (latest)\n`);
process.stdout.write(`Mode:         ${apply ? 'APPLY (delete)' : 'dry-run'}\n\n`);

const runs = listRuns(repo);
if (runs.length === 0) {
  process.stdout.write('No workflow runs found.\n');
  process.exit(0);
}

const { keep, delete: toDelete } = pickDeletes(runs, keepSuccess);

process.stdout.write(`Total runs: ${runs.length}\n`);
process.stdout.write(`Keep:       ${keep.length}\n`);
process.stdout.write(`Delete:     ${toDelete.length}\n\n`);

if (keep.length > 0) {
  process.stdout.write('--- kept (latest success) ---\n');
  for (const r of keep) {
    process.stdout.write(`  #${r.id} success ${r.head_branch} ${r.created_at.slice(0, 10)}\n`);
  }
  process.stdout.write('\n');
}

const byConclusion = toDelete.reduce<Record<string, number>>((acc, r) => {
  const k = r.conclusion ?? 'in_progress';
  acc[k] = (acc[k] ?? 0) + 1;
  return acc;
}, {});
process.stdout.write('--- delete breakdown ---\n');
for (const [k, n] of Object.entries(byConclusion)) {
  process.stdout.write(`  ${k}: ${n}\n`);
}
process.stdout.write('\n');

if (!apply) {
  process.stdout.write('Dry-run only. Re-run with --apply to delete.\n');
  process.exit(0);
}

let deleted = 0;
let failed = 0;
for (const r of toDelete) {
  if (ghDelete(repo, r.id)) deleted++;
  else failed++;
}
process.stdout.write(`Deleted: ${deleted} · failed: ${failed}\n`);
process.exit(failed > 0 ? 1 : 0);
