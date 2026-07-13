#!/usr/bin/env tsx
/**
 * H-06 deploy wrapper — clean SHA only · --commit-dirty=false · branch + commit hash forced.
 *
 * Usage:
 *   bun run deploy:pages:web
 *   bun run deploy:pages:web:preview
 *   bun run deploy:pages:admin
 *   bun run deploy:pages:admin:preview
 *
 * Or:
 *   tsx scripts/deploy-pages.ts --app=web --branch=preview
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isGitWorkingTreeDirty,
  readGitHeadSha,
  type ReleaseApp,
  type ReleaseBranch,
} from './lib/release-manifest';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const PROJECT: Record<ReleaseApp, string> = {
  web: 'phonara-web',
  admin: 'phonara-admin',
};

function parseArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}

function resolveApp(raw: string | undefined): ReleaseApp {
  if (raw === 'web' || raw === 'admin') return raw;
  throw new Error(`--app=web|admin required (got ${raw})`);
}

function resolveBranch(raw: string | undefined): ReleaseBranch {
  if (raw === 'main' || raw === 'preview') return raw;
  throw new Error(`--branch=main|preview required (got ${raw})`);
}

function run(cmd: string, args: string[], label: string): void {
  process.stdout.write(`[deploy-pages] ${label}: ${cmd} ${args.join(' ')}\n`);
  const r = spawnSync(cmd, args, {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

function main(): void {
  const app = resolveApp(parseArg('app'));
  const branch = resolveBranch(parseArg('branch'));

  if (isGitWorkingTreeDirty()) {
    process.stderr.write(
      '[deploy-pages] FAIL — working tree is dirty. H-06 forbids dirty Pages deploys.\n' +
        '  Commit or stash all changes, then re-run.\n',
    );
    process.exit(1);
  }

  const sha = readGitHeadSha();
  process.stdout.write(`[deploy-pages] clean SHA ${sha} · app=${app} · branch=${branch}\n`);

  const buildScript = app === 'web' ? 'build:web:production' : 'build:admin:production';
  run('bun', ['run', buildScript], 'build');

  run('bun', ['run', 'release:manifest', '--', `--app=${app}`, `--branch=${branch}`], 'manifest');

  const distDir = path.join('apps', app, 'dist');
  // Pages deploy: --project-name only (wrangler rejects --config for Pages).
  const wranglerArgs = [
    'pages',
    'deploy',
    distDir,
    '--project-name',
    PROJECT[app],
    '--branch',
    branch,
    '--commit-dirty=false',
    '--commit-hash',
    sha,
  ];

  run('wrangler', wranglerArgs, 'wrangler');
  process.stdout.write(`[deploy-pages] OK — ${app} @ ${sha.slice(0, 8)} (${branch})\n`);
}

main();
