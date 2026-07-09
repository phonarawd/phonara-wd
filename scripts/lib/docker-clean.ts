import { spawnSyncSafe } from './spawn-safe';
import { isDockerDaemonReady } from './docker-ready';

export type DockerCleanLevel = 'safe' | 'cache' | 'images';

export type DockerCleanOptions = {
  level?: DockerCleanLevel;
  quiet?: boolean;
};

type PruneStep = {
  label: string;
  args: string[];
};

function runDocker(args: string[], quiet: boolean): { ok: boolean; output: string } {
  const result = spawnSyncSafe('docker', args, {
    encoding: 'utf8',
    stdio: quiet ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });
  const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
  return { ok: result.status === 0, output };
}

function pruneSteps(level: DockerCleanLevel): PruneStep[] {
  const steps: PruneStep[] = [
    { label: 'stopped containers', args: ['container', 'prune', '-f'] },
    { label: 'unused networks', args: ['network', 'prune', '-f'] },
    { label: 'dangling images', args: ['image', 'prune', '-f'] },
  ];

  if (level === 'cache' || level === 'images') {
    steps.push({ label: 'build cache', args: ['builder', 'prune', '-f'] });
  }

  if (level === 'images') {
    // Re-pull on next `supabase start` — use only when disk is tight.
    steps.push({ label: 'unused images', args: ['image', 'prune', '-a', '-f'] });
  }

  return steps;
}

/**
 * Safe Docker hygiene after E2E/SQL — never deletes named Supabase volumes (DB data).
 * RAM lag: stop containers first (`stack:stop`); this frees disk + stale layers.
 */
export function runDockerClean(options: DockerCleanOptions = {}): {
  ran: boolean;
  reclaimedSummary: string[];
} {
  const { level = 'safe', quiet = false } = options;

  if (!isDockerDaemonReady()) {
    if (!quiet) {
      process.stdout.write('[stack:docker-clean] docker daemon OFF — nothing to prune\n');
    }
    return { ran: false, reclaimedSummary: [] };
  }

  const summary: string[] = [];

  for (const step of pruneSteps(level)) {
    if (!quiet) process.stdout.write(`[stack:docker-clean] pruning ${step.label}…\n`);
    const { ok, output } = runDocker(step.args, quiet);
    if (!ok) {
      process.stderr.write(`[stack:docker-clean] ${step.label} prune failed\n`);
      continue;
    }
    const reclaimed = output.match(/Total reclaimed space:\s*(.+)/i)?.[1];
    if (reclaimed) summary.push(`${step.label}: ${reclaimed}`);
  }

  if (!quiet) {
    process.stdout.write(
      summary.length > 0
        ? `[stack:docker-clean] done — ${summary.join(' · ')}\n`
        : '[stack:docker-clean] done — nothing significant to reclaim\n',
    );
  }

  return { ran: true, reclaimedSummary: summary };
}

/** Read-only snapshot for cursor:status (requires docker daemon). */
export function readDockerDiskSnapshot(): string | null {
  if (!isDockerDaemonReady()) return null;

  const df = spawnSyncSafe('docker', ['system', 'df'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  if (df.status !== 0 || !df.stdout?.trim()) return null;

  const lines = df.stdout.trim().split(/\r?\n/);
  const totals = lines.find((line) => line.startsWith('TYPE'));
  const reclaimable = lines
    .filter((line) => /Images|Containers|Local Volumes|Build Cache/.test(line))
    .map((line) => line.trim())
    .join(' | ');
  return totals ? `${totals}\n  ${reclaimable}` : reclaimable;
}

/**
 * DANGEROUS: deletes unused volumes (can wipe local Supabase DB).
 * Requires explicit operator flag — never called from posttest hooks.
 */
export function runDockerVolumePurge(options: { quiet?: boolean } = {}): void {
  const { quiet = false } = options;
  if (!isDockerDaemonReady()) {
    throw new Error('[stack:docker-clean] docker daemon OFF');
  }
  if (!quiet) {
    process.stderr.write(
      '[stack:docker-clean] WARNING: volume prune may delete local Supabase DB — run `supabase db reset` after\n',
    );
  }
  const { ok } = runDocker(['volume', 'prune', '-f'], quiet);
  if (!ok) throw new Error('[stack:docker-clean] volume prune failed');
}
