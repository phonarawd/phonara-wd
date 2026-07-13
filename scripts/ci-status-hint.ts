#!/usr/bin/env tsx
/**
 * CI status hint — push 후 GitHub Actions 확인 안내 (gh 미인증 PC 대응).
 * 정본: docs/SSOT/CI_GATE_AUTHORITY.md
 */
import { spawnSync } from 'node:child_process';
import { gitRemoteRepoOrExit } from './lib/git-remote-repo';

const WORKFLOW = 'ci.yml';

function gitBranch(): string {
  const r = spawnSync('git', ['branch', '--show-current'], { encoding: 'utf8' });
  return (r.stdout ?? '').trim() || 'main';
}

function tryGhRuns(repo: string): boolean {
  const r = spawnSync(
    'gh',
    ['run', 'list', '--repo', repo, '--workflow', WORKFLOW, '--limit', '5'],
    { encoding: 'utf8' },
  );
  if (r.status !== 0) {
    return false;
  }
  process.stdout.write('\n--- gh run list (latest 5) ---\n');
  process.stdout.write(r.stdout ?? '');
  return true;
}

const repo = gitRemoteRepoOrExit();
const branch = gitBranch();
const actionsUrl = `https://github.com/${repo}/actions/workflows/${WORKFLOW}`;
const branchUrl = `https://github.com/${repo}/actions?query=branch%3A${encodeURIComponent(branch)}`;

process.stdout.write('=== PHONARA CI (authoritative heavy gates) ===\n\n');
process.stdout.write(`Repository: ${repo}\n`);
process.stdout.write(`Branch:     ${branch}\n\n`);
process.stdout.write('Heavy gates (SQL · E2E · check:full) = GitHub Actions only.\n');
process.stdout.write('Agent MUST NOT run local test:e2e / test:sql / check:full (G13).\n\n');
process.stdout.write(`Actions UI: ${actionsUrl}\n`);
process.stdout.write(`This branch: ${branchUrl}\n\n`);
process.stdout.write('Required jobs green before Verified/DONE:\n');
process.stdout.write('  quality · sql · e2e · advisors\n');
process.stdout.write(
  'Optional advisory: e2e-browser-matrix (firefox/webkit · does not block merge)\n\n',
);
process.stdout.write('Actions hygiene: bun run ci:prune-runs (--apply after messy PR pushes)\n\n');

const ghOk = tryGhRuns(repo);
if (!ghOk) {
  process.stdout.write('gh CLI not authenticated — open Actions URL in browser after git push.\n');
  process.stdout.write('Optional: gh auth login → gh run watch\n');
}

process.stdout.write('\nLocal closeout only: bun run gate:ai-impl -- --test <path>\n');
process.stdout.write('After push: bun run ci:watch  (polls GitHub — no local E2E/SQL)\n');
