#!/usr/bin/env tsx
/**
 * Phase R — zero-defect final gate ladder (L0→L8 · single terminal · operator/CI authoritative).
 *
 * Turnkey sequence (no mid-work parallel gates · G1 compliant):
 *   preflight → L1(typecheck/lint/test/i18n/release/design/ui/hygiene)
 *   → L5(db reset · test:sql · stack:push-remote · advisor)
 *   → L6(target E2E + visual smoke) → L7(full test:e2e)
 *   → L8(check:full lite — mirror/guard/reconciliation without re-running sql/e2e)
 *   → teardown → gate-manifest JSON
 *
 * Usage:
 *   bun run gate:phase-r
 *   bun run gate:phase-r -- --skip-preflight --skip-target-e2e
 *   bun run gate:phase-r -- --skip-remote   # skip stack:push-remote when no token
 */
import { spawnSafe, spawnSyncSafe } from './lib/spawn-safe';
import {
  DEFAULT_MANIFEST_PATH,
  GateManifestCollector,
  printManifestSummary,
  type ManifestGateName,
} from './lib/gate-manifest';
import { runFullGate } from './run-full-gate';

interface CliOptions {
  skipPreflight: boolean;
  skipTargetE2e: boolean;
  skipRemote: boolean;
  manifestPath: string;
}

interface GateStep {
  readonly label: string;
  readonly command: string;
  readonly args: readonly string[];
  readonly env?: NodeJS.ProcessEnv;
}

interface TargetE2eSpec {
  readonly name: string;
  readonly gate: Extract<ManifestGateName, 'e2e' | 'visual'>;
  readonly command: string;
  readonly args: readonly string[];
}

/** Specs that exist on disk after Demolition — web-only via test:e2e:casino, admin via test:e2e. */
const PHASE_R_E2E_TARGETS: readonly TargetE2eSpec[] = [
  {
    name: 'wallet-d3',
    gate: 'e2e',
    command: 'bun',
    args: ['run', 'test:e2e:casino', '--', 'tests/e2e/wallet-d3.spec.ts'],
  },
  {
    name: 'trade-desk-smoke',
    gate: 'e2e',
    command: 'bun',
    args: ['run', 'test:e2e:casino', '--', 'tests/e2e/trade-desk-smoke.spec.ts'],
  },
  {
    name: 'p0-trade-browser-verify',
    gate: 'e2e',
    command: 'bun',
    args: ['run', 'test:e2e:casino', '--', 'tests/e2e/p0-trade-browser-verify.spec.ts'],
  },
  {
    name: 'admin',
    gate: 'e2e',
    command: 'bun',
    args: ['run', 'test:e2e', '--', 'tests/e2e/admin.spec.ts'],
  },
];

function parseArgs(): CliOptions {
  const argv = process.argv.slice(2);
  return {
    skipPreflight: argv.includes('--skip-preflight'),
    skipTargetE2e: argv.includes('--skip-target-e2e'),
    skipRemote: argv.includes('--skip-remote'),
    manifestPath:
      argv.find((a) => a.startsWith('--manifest='))?.slice('--manifest='.length) ??
      DEFAULT_MANIFEST_PATH,
  };
}

function runSyncStep(step: GateStep): void {
  process.stdout.write(`\n[gate:phase-r] ▶ ${step.label}\n`);
  const result = spawnSyncSafe(step.command, [...step.args], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: step.env ? { ...process.env, ...step.env } : process.env,
  });
  if (result.status !== 0) {
    throw new Error(`[gate:phase-r] ${step.label} failed (exit ${result.status ?? 'unknown'})`);
  }
}

async function runAsyncStep(step: GateStep): Promise<void> {
  process.stdout.write(`\n[gate:phase-r] ▶ ${step.label}\n`);
  await new Promise<void>((resolve, reject) => {
    const child = spawnSafe(step.command, [...step.args], {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: step.env ? { ...process.env, ...step.env } : process.env,
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
            ? `[gate:phase-r] ${step.label} terminated by ${signal}`
            : `[gate:phase-r] ${step.label} failed (exit ${code ?? 'unknown'})`,
        ),
      );
    });
  });
}

function hasRemotePushToken(): boolean {
  return Boolean(process.env.SUPABASE_ACCESS_TOKEN?.trim());
}

async function runTargetE2e(specs: readonly TargetE2eSpec[]): Promise<void> {
  for (const spec of specs) {
    await runAsyncStep({
      label: `L6 E2E target · ${spec.name}`,
      command: spec.command,
      args: spec.args,
    });
  }
}

async function main(): Promise<void> {
  const options = parseArgs();
  const manifest = new GateManifestCollector();
  let exitCode = 0;

  process.stdout.write(
    '[gate:phase-r] Phase R zero-defect gate ladder (L0→L8 · single terminal)\n',
  );

  try {
    if (!options.skipPreflight) {
      runSyncStep({
        label: 'L0 cursor:emergency-reset',
        command: 'bun',
        args: ['run', 'cursor:emergency-reset'],
      });
    }
    runSyncStep({ label: 'L0 cursor:status', command: 'bun', args: ['run', 'cursor:status'] });

    await manifest.recordRun('typecheck', async () => {
      runSyncStep({ label: 'L1 typecheck', command: 'bun', args: ['run', 'typecheck'] });
    });

    await manifest.recordRun('lint', async () => {
      runSyncStep({ label: 'L2 lint', command: 'bun', args: ['run', 'lint'] });
    });

    runSyncStep({ label: 'L3 unit test', command: 'bun', args: ['run', 'test'] });
    runSyncStep({ label: 'L1 check:i18n', command: 'bun', args: ['run', 'check:i18n'] });
    runSyncStep({ label: 'L1 check:release', command: 'bun', args: ['run', 'check:release'] });
    runSyncStep({
      label: 'L1 check:design-tokens',
      command: 'bun',
      args: ['run', 'check:design-tokens'],
    });
    runSyncStep({
      label: 'L0 check:ui-architecture',
      command: 'bun',
      args: ['run', 'check:ui-architecture'],
    });
    runSyncStep({ label: 'L0 check:hygiene', command: 'bun', args: ['run', 'check:hygiene'] });

    await manifest.recordRun('sql', async () => {
      runSyncStep({ label: 'L5 supabase db reset', command: 'supabase', args: ['db', 'reset'] });
      runSyncStep({
        label: 'L5 test:sql',
        command: 'bun',
        args: ['run', 'test:sql'],
        env: { PHONARA_KEEP_STACK: '1' },
      });
    });

    if (options.skipRemote || !hasRemotePushToken()) {
      process.stdout.write(
        '\n[gate:phase-r] ⚠ skip stack:push-remote (no SUPABASE_ACCESS_TOKEN or --skip-remote)\n',
      );
    } else {
      runSyncStep({
        label: 'L5 stack:push-remote',
        command: 'bun',
        args: ['run', 'stack:push-remote'],
      });
    }

    await manifest.recordRun('advisor', async () => {
      runSyncStep({
        label: 'L5 check:advisors (strict)',
        command: 'bun',
        args: ['run', 'check:advisors'],
        env: { PHONARA_ADVISORS_STRICT: '1' },
      });
    });

    if (!options.skipTargetE2e) {
      await runTargetE2e(PHASE_R_E2E_TARGETS);
    }

    await manifest.recordRun('e2e', async () => {
      runSyncStep({ label: 'L7 test:e2e (full suite)', command: 'bun', args: ['run', 'test:e2e'] });
    });

    await manifest.recordRun('pwa', async () => {
      runSyncStep({ label: 'L1 check:pwa', command: 'bun', args: ['run', 'check:pwa'] });
    });

    await runFullGate({
      manifest,
      skipSqlE2e: true,
      skipPwa: manifest.hasRecorded('pwa'),
    });

    runSyncStep({ label: 'teardown e2e:kill', command: 'bun', args: ['run', 'e2e:kill'] });
    runSyncStep({
      label: 'teardown cursor:session-end',
      command: 'bun',
      args: ['run', 'cursor:session-end'],
    });

    const allowAdvisorSkip = options.skipRemote || !hasRemotePushToken();
    const path = manifest.writeFinal({ allowAdvisorSkip, outputPath: options.manifestPath });
    const finalManifest = manifest.finalize({ allowAdvisorSkip });
    printManifestSummary(finalManifest);
    process.stdout.write(`\n[gate:phase-r] ✓ manifest written → ${path}\n`);
    process.stdout.write('[gate:phase-r] ✓ Phase R ladder green — operator/CI authoritative\n');
  } catch (error) {
    exitCode = 1;
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`\n[gate:phase-r] ✗ FAIL: ${message}\n`);
    try {
      const allowAdvisorSkip = options.skipRemote || !hasRemotePushToken();
      const path = manifest.writeFinal({ allowAdvisorSkip, outputPath: options.manifestPath });
      printManifestSummary(manifest.finalize({ allowAdvisorSkip }));
      process.stderr.write(`[gate:phase-r] manifest written (failed run) → ${path}\n`);
    } catch {
      // manifest write is best-effort on crash
    }
  }

  process.exit(exitCode);
}

main();
