/**
 * Fast read-only snapshot — no kills, no cleans. Safe during lag spikes.
 */
import { listOrphanRepoDevProcesses, listRepoDevProcesses } from './lib/cursor-dev-processes';
import { isDockerDaemonReady } from './lib/docker-ready';
import { readDockerDiskSnapshot } from './lib/docker-clean';
import { isLocalSupabaseRunning } from './lib/supabase-local';
import { E2E_PORTS } from './lib/e2e-lifecycle';
import { SESSION_RESIDUE_DIRS } from './lib/workspace-artifacts';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

function portBusy(port: number): boolean {
  try {
    const out = execSync('netstat -ano', { encoding: 'utf8' });
    return out.split('\n').some((line) => line.includes('LISTENING') && line.includes(`:${port} `));
  } catch {
    return false;
  }
}

const orphans = listOrphanRepoDevProcesses();
const repoProcs = listRepoDevProcesses();
const residue = SESSION_RESIDUE_DIRS.filter((dir) => existsSync(dir));

process.stdout.write(`[cursor:status] repo node/bun processes: ${repoProcs.length}\n`);
process.stdout.write(`[cursor:status] orphan candidates: ${orphans.length}\n`);
for (const orphan of orphans.slice(0, 6)) {
  process.stdout.write(`  pid=${orphan.pid} ${orphan.name} ${orphan.commandLine.slice(0, 100)}\n`);
}

process.stdout.write('[cursor:status] E2E ports:\n');
for (const port of E2E_PORTS) {
  process.stdout.write(`  ${port}: ${portBusy(port) ? 'BUSY' : 'free'}\n`);
}

if (residue.length > 0) {
  process.stdout.write(`[cursor:status] session residue: ${residue.join(', ')}\n`);
} else {
  process.stdout.write('[cursor:status] session residue: none\n');
}

process.stdout.write('[cursor:status] Docker / Supabase:\n');
process.stdout.write(
  `  docker daemon: ${isDockerDaemonReady() ? 'ready' : 'OFF (start manually before E2E/SQL)'}\n`,
);
process.stdout.write(
  `  supabase local: ${isLocalSupabaseRunning() ? 'RUNNING (~15 containers — run stack:stop when idle)' : 'stopped'}\n`,
);
const dockerDf = readDockerDiskSnapshot();
if (dockerDf) {
  process.stdout.write('[cursor:status] docker disk (reclaimable):\n');
  for (const line of dockerDf.split('\n')) {
    process.stdout.write(`  ${line}\n`);
  }
  process.stdout.write('  tip: bun run stack:docker-clean --cache  (disk tight) · quit Docker Desktop when not E2E/SQL\n');
} else if (isDockerDaemonReady()) {
  process.stdout.write('  docker disk: (unable to read — run stack:docker-clean manually)\n');
}
