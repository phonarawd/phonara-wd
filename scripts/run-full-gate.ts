import { spawnSafe } from './lib/spawn-safe';
import { readLocalSupabaseEnv } from './lib/db-connect';
import {
  DEFAULT_MANIFEST_PATH,
  GateManifestCollector,
  printManifestSummary,
  type ManifestGateName,
} from './lib/gate-manifest';

interface GateStep {
  readonly name: string;
  readonly command: string;
  readonly args: readonly string[];
  readonly env?: NodeJS.ProcessEnv | (() => NodeJS.ProcessEnv);
  readonly manifestGate?: ManifestGateName;
}

export interface RunFullGateOptions {
  /** When set, gate durations are recorded into the manifest. */
  readonly manifest?: GateManifestCollector;
  /** Phase R already ran sql + e2e — skip duplicate heavy steps. */
  readonly skipSqlE2e?: boolean;
  /** Phase R already ran check:pwa — skip duplicate pwa step. */
  readonly skipPwa?: boolean;
  readonly manifestPath?: string;
}

function localSupabaseEnv(): NodeJS.ProcessEnv {
  const env = readLocalSupabaseEnv();
  if (!env) {
    throw new Error('[check:full] unable to read local Supabase env for E2E');
  }

  return {
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_SECRET_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
    VITE_SUPABASE_URL: env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY,
  };
}

async function waitForLocalAuth(): Promise<void> {
  const env = readLocalSupabaseEnv();
  const baseUrl = env?.VITE_SUPABASE_URL ?? 'http://127.0.0.1:54321';
  const deadline = Date.now() + 90_000;
  let lastError = 'not attempted';

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/auth/v1/health`);
      if (response.ok) return;
      lastError = `status ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await new Promise<void>((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error(`[check:full] local Auth did not become ready before E2E: ${lastError}`);
}

function buildSteps(options: RunFullGateOptions): GateStep[] {
  const steps: GateStep[] = [
    {
      name: 'standard check',
      command: 'bun',
      args: ['run', 'check'],
      env: { PHONARA_ADVISORS_STRICT: '1' },
      manifestGate: 'advisor',
    },
  ];

  if (!options.skipPwa) {
    steps.push({
      name: 'pwa',
      command: 'bun',
      args: ['run', 'check:pwa'],
      manifestGate: 'pwa',
    });
  }

  if (!options.skipSqlE2e) {
    steps.push(
      { name: 'supabase reset', command: 'supabase', args: ['db', 'reset'], manifestGate: 'sql' },
      {
        name: 'functions mirror regenerate',
        command: 'bun',
        args: ['run', 'mirror:functions'],
      },
      {
        name: 'functions mirror',
        command: 'bun',
        args: ['run', 'check:functions-mirror'],
        env: { PHONARA_FUNCTIONS_MIRROR_STRICT: '1' },
      },
      {
        name: 'database types drift',
        command: 'bun',
        args: ['run', 'check:types'],
        env: { PHONARA_DATABASE_TYPES_STRICT: '1' },
      },
      {
        name: 'guard coverage',
        command: 'bun',
        args: ['run', 'check:guard-coverage'],
        env: { PHONARA_GUARD_COVERAGE_STRICT: '1' },
      },
      {
        name: 'sql',
        command: 'bun',
        args: ['run', 'test:sql'],
        env: { PHONARA_KEEP_STACK: '1' },
        manifestGate: 'sql',
      },
      {
        name: 'reconciliation launch gate',
        command: 'bun',
        args: ['run', 'check:reconciliation-launch'],
        env: { PHONARA_KEEP_STACK: '1' },
      },
      {
        name: 'casino sql parity',
        command: 'bunx',
        args: ['vitest', 'run', 'tests/integration/casino-sql-parity.test.ts'],
        env: { PHONARA_SQL_PARITY: '1' },
      },
      {
        name: 'e2e',
        command: 'bun',
        args: ['run', 'test:e2e'],
        env: localSupabaseEnv,
        manifestGate: 'e2e',
      },
    );
  } else {
    steps.push(
      {
        name: 'functions mirror regenerate',
        command: 'bun',
        args: ['run', 'mirror:functions'],
      },
      {
        name: 'functions mirror',
        command: 'bun',
        args: ['run', 'check:functions-mirror'],
        env: { PHONARA_FUNCTIONS_MIRROR_STRICT: '1' },
      },
      {
        name: 'database types drift',
        command: 'bun',
        args: ['run', 'check:types'],
        env: { PHONARA_DATABASE_TYPES_STRICT: '1' },
      },
      {
        name: 'guard coverage',
        command: 'bun',
        args: ['run', 'check:guard-coverage'],
        env: { PHONARA_GUARD_COVERAGE_STRICT: '1' },
      },
      {
        name: 'reconciliation launch gate',
        command: 'bun',
        args: ['run', 'check:reconciliation-launch'],
        env: { PHONARA_KEEP_STACK: '1' },
      },
      {
        name: 'casino sql parity',
        command: 'bunx',
        args: ['vitest', 'run', 'tests/integration/casino-sql-parity.test.ts'],
        env: { PHONARA_SQL_PARITY: '1' },
      },
    );
  }

  return steps;
}

async function runStep(step: GateStep, manifest?: GateManifestCollector): Promise<void> {
  process.stdout.write(`\n[check:full] ${step.name}\n`);

  if (step.name === 'e2e') {
    await waitForLocalAuth();
  }

  const gateName = step.manifestGate;
  const gateStarted = gateName ? Date.now() : 0;

  await new Promise<void>((resolve, reject) => {
    const child = spawnSafe(step.command, [...step.args], {
      cwd: process.cwd(),
      env: { ...process.env, ...(typeof step.env === 'function' ? step.env() : step.env) },
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

  if (gateName && manifest && !manifest.hasRecorded(gateName)) {
    manifest.record(gateName, 'pass', Date.now() - gateStarted);
  }
}

export async function runFullGate(options: RunFullGateOptions = {}): Promise<void> {
  const manifest = options.manifest ?? new GateManifestCollector();
  const ownManifest = !options.manifest;

  for (const step of buildSteps(options)) {
    const gateName = step.manifestGate;
    const gateStarted = gateName ? Date.now() : 0;
    try {
      await runStep(step, manifest);
    } catch (error) {
      if (gateName && !manifest.hasRecorded(gateName)) {
        const message = error instanceof Error ? error.message : String(error);
        manifest.record(gateName, 'fail', Date.now() - gateStarted, message);
      }
      if (ownManifest) {
        const path = manifest.writeFinal({
          allowSkip: true,
          outputPath: options.manifestPath ?? DEFAULT_MANIFEST_PATH,
        });
        printManifestSummary(manifest.finalize({ allowSkip: true }));
        process.stderr.write(`[check:full] manifest written (failed run) → ${path}\n`);
      }
      throw error;
    }
  }

  if (ownManifest) {
    const path = manifest.writeFinal({
      allowSkip: true,
      outputPath: options.manifestPath ?? DEFAULT_MANIFEST_PATH,
    });
    const finalManifest = manifest.finalize({ allowSkip: true });
    printManifestSummary(finalManifest);
    process.stdout.write(`\n[check:full] manifest → ${path}\n`);
    process.stdout.write(
      `\ncheck:full OK - local check, PWA, SQL, casino parity, and E2E passed · releaseReady=${finalManifest.releaseReady}\n`,
    );
  } else {
    process.stdout.write('\n[check:full] L8 lite steps OK (Phase R embedded)\n');
  }
}

const entryScript = process.argv[1]?.replace(/\\/g, '/');
if (entryScript?.endsWith('run-full-gate.ts')) {
  runFullGate().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  });
}
