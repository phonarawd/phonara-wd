#!/usr/bin/env tsx
/**
 * CI watch — lightweight GitHub Actions poll after push (G13).
 * Does NOT run local E2E/SQL/Docker. Zero RAM cost on 8GB operator PC.
 * 정본: docs/SSOT/CI_GATE_AUTHORITY.md
 */
import { spawnSync } from 'node:child_process';

const WORKFLOW = 'ci.yml';
const REQUIRED_JOBS = ['quality', 'sql', 'e2e', 'advisors'] as const;
const DEFAULT_TIMEOUT_MIN = 45;
const POLL_INTERVAL_MS = 20_000;

function parseArgs(): { timeoutMin: number; once: boolean } {
  const argv = process.argv.slice(2);
  let timeoutMin = DEFAULT_TIMEOUT_MIN;
  let once = false;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--once') {
      once = true;
    } else if (arg === '--timeout-min' && argv[i + 1]) {
      timeoutMin = Math.max(1, Number.parseInt(argv[i + 1] ?? '', 10) || DEFAULT_TIMEOUT_MIN);
      i += 1;
    }
  }
  return { timeoutMin, once };
}

function gitBranch(): string {
  const r = spawnSync('git', ['branch', '--show-current'], { encoding: 'utf8' });
  return (r.stdout ?? '').trim() || 'main';
}

function gitRemoteRepo(): string {
  const r = spawnSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' });
  const url = (r.stdout ?? '').trim();
  const m = url.match(/github\.com[:/]([^/]+\/[^/.]+)/i);
  return m?.[1]?.replace(/\.git$/, '') ?? 'phonaralv/phonara-gb';
}

function ghAvailable(): boolean {
  const r = spawnSync('gh', ['--version'], { encoding: 'utf8' });
  return r.status === 0;
}

function ghJson<T>(args: string[]): T | null {
  const r = spawnSync('gh', args, { encoding: 'utf8' });
  if (r.status !== 0) {
    return null;
  }
  try {
    return JSON.parse(r.stdout ?? '') as T;
  } catch {
    return null;
  }
}

type GhRun = {
  databaseId: number;
  status: string;
  conclusion: string | null;
  url: string;
  headBranch: string;
  event: string;
};

type GhJob = {
  name: string;
  status: string;
  conclusion: string | null;
};

function latestRun(repo: string, branch: string): GhRun | null {
  const runs = ghJson<GhRun[]>([
    'run',
    'list',
    '--repo',
    repo,
    '--workflow',
    WORKFLOW,
    '--branch',
    branch,
    '--limit',
    '1',
    '--json',
    'databaseId,status,conclusion,url,headBranch,event',
  ]);
  return runs?.[0] ?? null;
}

function runJobs(repo: string, runId: number): GhJob[] {
  return (
    (
      ghJson<GhJob[]>(['run', 'view', String(runId), '--repo', repo, '--json', 'jobs']) as {
        jobs?: GhJob[];
      } | null
    )?.jobs ?? []
  );
}

function normalizeJobName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('typecheck') || lower.includes('quality')) return 'quality';
  if (lower.includes('sql')) return 'sql';
  if (lower.includes('e2e') && !lower.includes('browser')) return 'e2e';
  // Do not match "advisory" (e.g. browser-matrix advisory) as required advisors.
  if (lower.includes('advisor') && !lower.includes('advisory')) return 'advisors';
  return lower;
}

function summarizeJobs(
  jobs: GhJob[],
): Record<string, { status: string; conclusion: string | null }> {
  const map: Record<string, { status: string; conclusion: string | null }> = {};
  for (const job of jobs) {
    const key = normalizeJobName(job.name);
    const existing = map[key];
    if (!existing || job.status === 'in_progress' || job.status === 'queued') {
      map[key] = { status: job.status, conclusion: job.conclusion };
    }
  }
  return map;
}

function allRequiredGreen(
  summary: Record<string, { status: string; conclusion: string | null }>,
): boolean {
  return REQUIRED_JOBS.every((j) => summary[j]?.conclusion === 'success');
}

function anyRequiredFailed(
  summary: Record<string, { status: string; conclusion: string | null }>,
): boolean {
  return REQUIRED_JOBS.some((j) => {
    const c = summary[j]?.conclusion;
    return c === 'failure' || c === 'cancelled' || c === 'timed_out';
  });
}

function sleep(ms: number): void {
  spawnSync('powershell', ['-NoProfile', '-Command', `Start-Sleep -Milliseconds ${ms}`], {
    stdio: 'ignore',
    shell: false,
  });
}

function printSummary(
  run: GhRun,
  summary: Record<string, { status: string; conclusion: string | null }>,
): void {
  process.stdout.write(
    `\nRun #${run.databaseId} · ${run.status} · ${run.conclusion ?? 'pending'}\n`,
  );
  process.stdout.write(`${run.url}\n\n`);
  for (const job of REQUIRED_JOBS) {
    const row = summary[job];
    const icon =
      row?.conclusion === 'success' ? '✓' : row?.conclusion === 'failure' ? '✗' : row ? '…' : '?';
    process.stdout.write(
      `  ${icon} ${job}: ${row?.status ?? 'missing'} / ${row?.conclusion ?? '—'}\n`,
    );
  }
  process.stdout.write('\n');
}

function main(): void {
  const { timeoutMin, once } = parseArgs();
  const repo = gitRemoteRepo();
  const branch = gitBranch();
  const actionsUrl = `https://github.com/${repo}/actions/workflows/${WORKFLOW}`;

  process.stdout.write('=== PHONARA CI Watch (lightweight · no local E2E/SQL) ===\n\n');
  process.stdout.write(`Repository: ${repo}\n`);
  process.stdout.write(`Branch:     ${branch}\n`);
  process.stdout.write(`Required:   ${REQUIRED_JOBS.join(' · ')}\n\n`);

  if (!ghAvailable()) {
    process.stderr.write('gh CLI not found or not authenticated.\n');
    process.stderr.write(`Open after push: ${actionsUrl}\n`);
    process.stderr.write('Setup: gh auth login\n');
    process.exitCode = 1;
    return;
  }

  const deadline = Date.now() + timeoutMin * 60_000;

  while (true) {
    const run = latestRun(repo, branch);
    if (!run) {
      process.stdout.write(`No CI run found for branch "${branch}". Push first, then re-run.\n`);
      process.stdout.write(`${actionsUrl}\n`);
      process.exitCode = 1;
      return;
    }

    const jobs = runJobs(repo, run.databaseId);
    const summary = summarizeJobs(jobs);
    printSummary(run, summary);

    if (run.status === 'completed') {
      if (allRequiredGreen(summary)) {
        process.stdout.write('CI VERIFIED — all required jobs green.\n');
        return;
      }
      if (anyRequiredFailed(summary)) {
        process.stderr.write('CI FAILED — fix code, push, then ci:watch again.\n');
        process.stderr.write(`Logs: gh run view ${run.databaseId} --repo ${repo} --log-failed\n`);
        process.exitCode = 1;
        return;
      }
      process.stderr.write('CI completed but required jobs missing or inconclusive.\n');
      process.exitCode = 1;
      return;
    }

    if (once) {
      process.stdout.write('CI still running (--once). Re-run: bun run ci:watch\n');
      return;
    }

    if (Date.now() >= deadline) {
      process.stderr.write(`Timeout after ${timeoutMin} minutes. Check Actions UI.\n`);
      process.exitCode = 1;
      return;
    }

    process.stdout.write(`Polling again in ${POLL_INTERVAL_MS / 1000}s…\n`);
    sleep(POLL_INTERVAL_MS);
  }
}

main();
