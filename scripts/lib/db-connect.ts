import { spawnSync } from 'node:child_process';

export const DEFAULT_DB_URL =
  process.env.SUPABASE_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54442/postgres';

export function hasPsql(): boolean {
  const probe = spawnSync('psql', ['--version'], { stdio: 'ignore', shell: process.platform === 'win32' });
  return probe.status === 0;
}

export function findSupabaseDbContainer(): string | null {
  const probe = spawnSync('docker', ['ps', '--format', '{{.Names}}'], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (probe.status !== 0 || !probe.stdout) return null;
  const match = probe.stdout
    .split(/\r?\n/)
    .map((s) => s.trim())
    .find((name) => name.startsWith('supabase_db_'));
  return match ?? null;
}

export interface DbQueryResult {
  readonly mode: 'psql' | 'docker' | 'unavailable';
  readonly detail: string;
  readonly stdout: string;
  readonly ok: boolean;
  readonly stderr: string;
}

/** Run a single SQL statement; returns null stdout when no DB is reachable. */
export function runDbQuery(sql: string, dbUrl = DEFAULT_DB_URL): DbQueryResult {
  if (hasPsql()) {
    const result = spawnSync('psql', [dbUrl, '-t', '-A', '-q', '-v', 'ON_ERROR_STOP=1', '-c', sql], {
      encoding: 'utf8',
      shell: process.platform === 'win32',
      maxBuffer: 32 * 1024 * 1024,
    });
    return {
      mode: 'psql',
      detail: dbUrl,
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? '',
      ok: result.status === 0,
    };
  }

  const container = findSupabaseDbContainer();
  if (!container) {
    return { mode: 'unavailable', detail: 'no psql and no supabase_db_* container', stdout: '', stderr: '', ok: false };
  }

  const result = spawnSync(
    'docker',
    ['exec', '-i', container, 'psql', '-U', 'postgres', '-d', 'postgres', '-t', '-A', '-q', '-v', 'ON_ERROR_STOP=1', '-c', sql],
    { encoding: 'utf8', shell: process.platform === 'win32', maxBuffer: 32 * 1024 * 1024 },
  );
  return {
    mode: 'docker',
    detail: container,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    ok: result.status === 0,
  };
}

/** JSON aggregate query helper — expects a single JSON cell in stdout. */
export function runDbJsonQuery<T>(sql: string, dbUrl = DEFAULT_DB_URL): { ok: boolean; data: T | null; error: string } {
  const result = runDbQuery(sql, dbUrl);
  if (result.mode === 'unavailable') {
    return { ok: false, data: null, error: result.detail };
  }
  if (!result.ok) {
    return { ok: false, data: null, error: result.stderr || 'query failed' };
  }
  try {
    return { ok: true, data: JSON.parse(result.stdout.trim() || 'null') as T, error: '' };
  } catch (error) {
    return {
      ok: false,
      data: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function readLocalSupabaseEnv(): Record<string, string> | null {
  const result = spawnSync('supabase', ['status', '-o', 'env'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) return null;
  const values = new Map<string, string>();
  for (const line of result.stdout.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=['"]?(.+?)['"]?$/);
    if (match) values.set(match[1]!, match[2]!);
  }
  const serviceRoleKey =
    values.get('SECRET_KEY') ?? values.get('SUPABASE_SERVICE_ROLE_KEY') ?? values.get('SERVICE_ROLE_KEY');
  const anonKey = values.get('ANON_KEY');
  if (!serviceRoleKey || !anonKey) return null;
  return {
    VITE_SUPABASE_URL: 'http://127.0.0.1:54444',
    VITE_SUPABASE_ANON_KEY: anonKey.replace(/^['"]|['"]$/g, ''),
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey.replace(/^['"]|['"]$/g, ''),
  };
}
