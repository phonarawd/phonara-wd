import { spawnSyncSafe } from './spawn-safe';

export const DEFAULT_DB_URL =
  process.env.SUPABASE_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

export function hasPsql(): boolean {
  const probe = spawnSyncSafe('psql', ['--version'], { stdio: 'ignore' });
  return probe.status === 0;
}

export function findSupabaseDbContainer(): string | null {
  const probe = spawnSyncSafe('docker', ['ps', '--format', '{{.Names}}'], {
    encoding: 'utf8',
  });
  if (probe.status !== 0 || !probe.stdout) return null;
  const match = probe.stdout
    .split(/\r?\n/)
    .map((s) => s.trim())
    .find((name) => name.startsWith('supabase_db_'));
  return match ?? null;
}

/** Postgres URL via the container bridge IP — avoids GHA host port 54322 not yet bound. */
export function resolveSupabaseContainerDbUrl(
  container = findSupabaseDbContainer(),
): string | null {
  if (!container) return null;
  const inspect = spawnSyncSafe(
    'docker',
    ['inspect', '-f', '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}', container],
    { encoding: 'utf8' },
  );
  const ip = inspect.stdout?.trim();
  if (inspect.status !== 0 || !ip) return null;
  return `postgresql://postgres:postgres@${ip}:5432/postgres`;
}

/** True when Postgres answers SELECT 1 (docker exec preferred over host port). */
export function probePostgresReady(dbUrl = DEFAULT_DB_URL): boolean {
  const container = findSupabaseDbContainer();
  if (container) {
    const result = spawnSyncSafe(
      'docker',
      ['exec', container, 'psql', '-U', 'postgres', '-At', '-c', 'SELECT 1'],
      { encoding: 'utf8' },
    );
    return result.status === 0 && (result.stdout ?? '').trim() === '1';
  }

  if (hasPsql()) {
    const result = spawnSyncSafe('psql', [dbUrl, '-At', '-c', 'SELECT 1'], { encoding: 'utf8' });
    return result.status === 0 && (result.stdout ?? '').trim() === '1';
  }

  return false;
}

export interface DbQueryResult {
  readonly mode: 'psql' | 'docker' | 'unavailable';
  readonly detail: string;
  readonly stdout: string;
  readonly ok: boolean;
  readonly stderr: string;
}

export interface DbScriptResult {
  readonly mode: 'psql' | 'docker' | 'unavailable';
  readonly detail: string;
  readonly stdout: string;
  readonly stderr: string;
  readonly ok: boolean;
}

export interface RunDbScriptOptions {
  readonly dbUrl?: string;
  /** Extra psql flags after ON_ERROR_STOP (e.g. `-At` for tab-aligned tuples-only). */
  readonly psqlArgs?: readonly string[];
  readonly maxBuffer?: number;
}

const UNAVAILABLE_SCRIPT: DbScriptResult = {
  mode: 'unavailable',
  detail: 'no psql on PATH and no supabase_db_* container',
  stdout: '',
  stderr: '',
  ok: false,
};

function runDockerPsqlScript(
  container: string,
  sql: string,
  psqlArgs: readonly string[],
  maxBuffer: number,
): DbScriptResult {
  const result = spawnSyncSafe(
    'docker',
    [
      'exec',
      '-i',
      container,
      'psql',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-v',
      'ON_ERROR_STOP=1',
      ...psqlArgs,
    ],
    {
      input: sql,
      encoding: 'utf8',
      maxBuffer,
    },
  );
  return {
    mode: 'docker',
    detail: container,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    ok: result.status === 0,
  };
}

function runHostPsqlScript(
  dbUrl: string,
  sql: string,
  psqlArgs: readonly string[],
  maxBuffer: number,
): DbScriptResult {
  const result = spawnSyncSafe('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1', ...psqlArgs], {
    input: sql,
    encoding: 'utf8',
    maxBuffer,
  });
  return {
    mode: 'psql',
    detail: dbUrl,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    ok: result.status === 0,
  };
}

/** Pipe SQL on stdin — for large scripts that exceed shell `-c` length limits. */
export function runDbScript(sql: string, options: RunDbScriptOptions = {}): DbScriptResult {
  const dbUrl = options.dbUrl ?? DEFAULT_DB_URL;
  const maxBuffer = options.maxBuffer ?? 64 * 1024 * 1024;
  const psqlArgs = options.psqlArgs ?? [];

  const container = findSupabaseDbContainer();
  if (container) {
    return runDockerPsqlScript(container, sql, psqlArgs, maxBuffer);
  }

  if (hasPsql()) {
    return runHostPsqlScript(dbUrl, sql, psqlArgs, maxBuffer);
  }

  return UNAVAILABLE_SCRIPT;
}

/** Run a single SQL statement; returns null stdout when no DB is reachable. */
export function runDbQuery(sql: string, dbUrl = DEFAULT_DB_URL): DbQueryResult {
  const container = findSupabaseDbContainer();
  if (container) {
    const result = spawnSyncSafe(
      'docker',
      [
        'exec',
        '-i',
        container,
        'psql',
        '-U',
        'postgres',
        '-d',
        'postgres',
        '-t',
        '-A',
        '-q',
        '-v',
        'ON_ERROR_STOP=1',
        '-c',
        sql,
      ],
      { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
    );
    return {
      mode: 'docker',
      detail: container,
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? '',
      ok: result.status === 0,
    };
  }

  if (hasPsql()) {
    const result = spawnSyncSafe(
      'psql',
      [dbUrl, '-t', '-A', '-q', '-v', 'ON_ERROR_STOP=1', '-c', sql],
      {
        encoding: 'utf8',
        maxBuffer: 32 * 1024 * 1024,
      },
    );
    return {
      mode: 'psql',
      detail: dbUrl,
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? '',
      ok: result.status === 0,
    };
  }

  return {
    mode: 'unavailable',
    detail: 'no psql and no supabase_db_* container',
    stdout: '',
    stderr: '',
    ok: false,
  };
}

/** JSON aggregate query helper — expects a single JSON cell in stdout. */
export function runDbJsonQuery<T>(
  sql: string,
  dbUrl = DEFAULT_DB_URL,
): { ok: boolean; data: T | null; error: string } {
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
  const result = spawnSyncSafe('supabase', ['status', '-o', 'env'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  if (result.status !== 0) return null;
  const values = new Map<string, string>();
  for (const line of result.stdout.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=['"]?(.+?)['"]?$/);
    if (match) values.set(match[1]!, match[2]!);
  }
  const serviceRoleKey =
    values.get('SECRET_KEY') ??
    values.get('SUPABASE_SERVICE_ROLE_KEY') ??
    values.get('SERVICE_ROLE_KEY');
  const anonKey = values.get('ANON_KEY');
  const apiUrl = values.get('API_URL') ?? values.get('REST_URL')?.replace(/\/rest\/v1\/?$/, '');
  if (!serviceRoleKey || !anonKey || !apiUrl) return null;
  return {
    VITE_SUPABASE_URL: apiUrl.replace(/^['"]|['"]$/g, ''),
    VITE_SUPABASE_ANON_KEY: anonKey.replace(/^['"]|['"]$/g, ''),
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey.replace(/^['"]|['"]$/g, ''),
  };
}
