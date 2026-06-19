import { spawn } from 'node:child_process';
import { spawnSync } from 'node:child_process';

interface GateStep {
  readonly name: string;
  readonly command: string;
  readonly args: readonly string[];
  readonly env?: NodeJS.ProcessEnv | (() => NodeJS.ProcessEnv);
}

function localSupabaseEnv(): NodeJS.ProcessEnv {
  const result = spawnSync('supabase', ['status', '-o', 'env'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    throw new Error('[check:full] unable to read local Supabase env for E2E');
  }

  const values = new Map<string, string>();
  for (const line of result.stdout.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=['"]?(.+?)['"]?$/);
    if (match) values.set(match[1]!, match[2]!);
  }

  const serviceRoleKey =
    values.get('SECRET_KEY') ?? values.get('SUPABASE_SERVICE_ROLE_KEY') ?? values.get('SERVICE_ROLE_KEY');
  const anonKey = values.get('ANON_KEY');

  if (!serviceRoleKey || !anonKey) {
    throw new Error('[check:full] local Supabase env is missing E2E credentials');
  }

  return {
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
    SUPABASE_SECRET_KEY: serviceRoleKey,
    VITE_SUPABASE_URL: 'http://127.0.0.1:54444',
    VITE_SUPABASE_ANON_KEY: anonKey,
  };
}

async function waitForLocalAuth(): Promise<void> {
  const deadline = Date.now() + 90_000;
  let lastError = 'not attempted';

  while (Date.now() < deadline) {
    try {
      const response = await fetch('http://127.0.0.1:54444/auth/v1/health');
      if (response.ok) return;
      lastError = `status ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await new Promise<void>((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error(`[check:full] local Auth did not become ready before E2E: ${lastError}`);
}

const steps: GateStep[] = [
  // Strict advisor mode: a skipped Supabase advisor run is NOT a pass for the
  // full launch-readiness gate. check:advisors (inside `bun run check`) fails
  // when SUPABASE_ACCESS_TOKEN is absent instead of silently exiting 0.
  { name: 'standard check', command: 'bun', args: ['run', 'check'], env: { PHONARA_ADVISORS_STRICT: '1' } },
  { name: 'pwa', command: 'bun', args: ['run', 'check:pwa'] },
  { name: 'supabase reset', command: 'supabase', args: ['db', 'reset'] },
  // posttest/clean:artifacts from standard check wipes supabase/functions-sql/;
  // regenerate from the freshly-reset DB before the strict drift check.
  { name: 'functions mirror regenerate', command: 'bun', args: ['run', 'mirror:functions'] },
  // After a clean apply of all append-only migrations, the committed function
  // mirror must match the database exactly (strict: a missing DB is a failure here).
  {
    name: 'functions mirror',
    command: 'bun',
    args: ['run', 'check:functions-mirror'],
    env: { PHONARA_FUNCTIONS_MIRROR_STRICT: '1' },
  },
  { name: 'sql', command: 'bun', args: ['run', 'test:sql'] },
  {
    name: 'casino sql parity',
    command: 'bunx',
    args: ['vitest', 'run', 'tests/integration/casino-sql-parity.test.ts'],
    env: { PHONARA_SQL_PARITY: '1' },
  },
  { name: 'e2e', command: 'bun', args: ['run', 'test:e2e'], env: localSupabaseEnv },
];

async function runStep(step: GateStep): Promise<void> {
  process.stdout.write(`\n[check:full] ${step.name}\n`);

  if (step.name === 'e2e') {
    await waitForLocalAuth();
  }

  return new Promise((resolve, reject) => {
    const child = spawn(step.command, step.args, {
      cwd: process.cwd(),
      env: { ...process.env, ...(typeof step.env === 'function' ? step.env() : step.env) },
      shell: process.platform === 'win32',
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          signal
            ? `[check:full] ${step.name} terminated by ${signal}`
            : `[check:full] ${step.name} failed with exit code ${code ?? 'unknown'}`,
        ),
      );
    });
  });
}

for (const step of steps) {
  await runStep(step);
}

process.stdout.write('\ncheck:full OK - local check, PWA, SQL, casino parity, and E2E passed\n');
