import { spawnSync } from 'node:child_process';

export const ORIGIN_SETUP_HINT =
  'git remote add origin https://github.com/<account>/phonara-wd.git';

/** Resolve `owner/repo` from `origin`. Exits when origin is missing or not GitHub. */
export function gitRemoteRepoOrExit(): string {
  const r = spawnSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' });
  const url = (r.stdout ?? '').trim();
  if (!url || r.status !== 0) {
    process.stderr.write(`origin remote is not configured. Run: ${ORIGIN_SETUP_HINT}\n`);
    process.exit(1);
  }
  const m = url.match(/github\.com[:/]([^/]+\/[^/.]+)/i);
  const repo = m?.[1]?.replace(/\.git$/, '');
  if (!repo) {
    process.stderr.write(`origin is not a GitHub URL: ${url}\n`);
    process.exit(1);
  }
  return repo;
}
