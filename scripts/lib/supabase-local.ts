import { spawnSync } from 'node:child_process';

export function findSupabaseDbContainer(): string | null {
  const probe = spawnSync('docker', ['ps', '--format', '{{.Names}}'], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (probe.status !== 0 || !probe.stdout) return null;
  return (
    probe.stdout
      .split(/\r?\n/)
      .map((s) => s.trim())
      .find((name) => name.startsWith('supabase_db_')) ?? null
  );
}

export function isLocalSupabaseRunning(): boolean {
  if (findSupabaseDbContainer()) return true;
  const status = spawnSync('bunx', ['supabase', 'status', '-o', 'json'], {
    stdio: 'pipe',
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  return status.status === 0 && /"API_URL"/.test(status.stdout ?? '');
}

export type EnsureLocalSupabaseOptions = {
  quiet?: boolean;
};

export function ensureLocalSupabaseStarted(options: EnsureLocalSupabaseOptions = {}): void {
  const { quiet = false } = options;
  if (isLocalSupabaseRunning()) {
    if (!quiet) process.stdout.write('[stack:supabase] local stack already running\n');
    return;
  }

  if (!quiet) process.stdout.write('[stack:supabase] starting local stack (`supabase start`)…\n');
  const start = spawnSync('bunx', ['supabase', 'start'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (start.status !== 0) {
    throw new Error('[stack:supabase] `supabase start` failed');
  }

  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (isLocalSupabaseRunning()) {
      if (!quiet) process.stdout.write('[stack:supabase] local stack ready\n');
      return;
    }
    spawnSync(
      process.platform === 'win32' ? 'powershell' : 'sleep',
      process.platform === 'win32'
        ? ['-NoProfile', '-Command', 'Start-Sleep -Seconds 2']
        : ['2'],
      { stdio: 'ignore' },
    );
  }

  throw new Error('[stack:supabase] local stack did not become ready in time');
}
