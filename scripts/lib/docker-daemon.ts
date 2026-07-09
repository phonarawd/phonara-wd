import { spawnSync } from 'node:child_process';

/** True when `docker info` succeeds (Linux engine pipe reachable). */
export function isDockerDaemonReady(): boolean {
  const probe = spawnSync('docker', ['info'], {
    stdio: 'ignore',
    timeout: 3_000,
  });
  return probe.status === 0;
}
