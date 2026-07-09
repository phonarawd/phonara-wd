#!/usr/bin/env tsx
/**
 * Local test autopilot — low-spec 8GB · single terminal · sequential · Docker on-demand.
 * Runs ALL tests locally in Cursor (no GitHub CI required).
 *
 * Usage:
 *   bun run gate:local-autopilot
 *   bun run gate:local-autopilot -- --from=e2e-wallet-d3
 *   bun run gate:local-autopilot -- --light-only
 *   bun run gate:local-autopilot -- --skip-sql --skip-e2e
 *
 * On failure: gate-manifest/local-test-report.json — AI reads → fixes → --from=<step>
 */
import { spawnSyncSafe, sleepMs } from './lib/spawn-safe';
import { checkRam } from './lib/ram-guard';
import {
  buildResumeCommand,
  writeLocalTestReport,
  type LocalTestReport,
} from './lib/local-test-report';

const ALLOW_ENV = 'PHONARA_ALLOW_LOCAL_HEAVY_GATE';

type LocalTestStep = {
  readonly id: string;
  readonly label: string;
  readonly tier: 'light' | 'heavy';
  readonly command: string;
  readonly args: readonly string[];
  readonly env?: Record<string, string>;
};

type CliOptions = {
  fromStep: string | null;
  lightOnly: boolean;
  skipSql: boolean;
  skipE2e: boolean;
  skipRemote: boolean;
};

const E2E_SPECS: readonly {
  id: string;
  label: string;
  command: string;
  args: readonly string[];
}[] = [
  {
    id: 'e2e-wallet-d3',
    label: 'E2E wallet-d3 (money Σ=0)',
    command: 'bun',
    args: ['run', 'test:e2e:casino', '--', 'tests/e2e/wallet-d3.spec.ts'],
  },
  {
    id: 'e2e-trade-desk',
    label: 'E2E trade-desk-smoke',
    command: 'bun',
    args: ['run', 'test:e2e:casino', '--', 'tests/e2e/trade-desk-smoke.spec.ts'],
  },
  {
    id: 'e2e-p0-browser',
    label: 'E2E p0-trade-browser-verify',
    command: 'bun',
    args: ['run', 'test:e2e:casino', '--', 'tests/e2e/p0-trade-browser-verify.spec.ts'],
  },
  {
    id: 'e2e-admin',
    label: 'E2E admin (auth · RBAC)',
    command: 'bun',
    args: ['run', 'test:e2e', '--', 'tests/e2e/admin.spec.ts'],
  },
  {
    id: 'e2e-smoke-web',
    label: 'E2E smoke web',
    command: 'bun',
    args: ['run', 'test:e2e:casino', '--', 'tests/smoke/web.spec.ts'],
  },
];

function buildSteps(options: CliOptions): LocalTestStep[] {
  const steps: LocalTestStep[] = [
    {
      id: 'l0-status',
      label: 'L0 cursor:status',
      tier: 'light',
      command: 'bun',
      args: ['run', 'cursor:status'],
    },
    {
      id: 'l0-hygiene',
      label: 'L0 check:hygiene',
      tier: 'light',
      command: 'bun',
      args: ['run', 'check:hygiene'],
    },
    {
      id: 'l1-typecheck',
      label: 'L1 typecheck',
      tier: 'light',
      command: 'bun',
      args: ['run', 'typecheck'],
    },
    { id: 'l2-lint', label: 'L2 lint', tier: 'light', command: 'bun', args: ['run', 'lint'] },
    {
      id: 'l1-i18n',
      label: 'L1 check:i18n',
      tier: 'light',
      command: 'bun',
      args: ['run', 'check:i18n'],
    },
    {
      id: 'l1-release',
      label: 'L1 check:release',
      tier: 'light',
      command: 'bun',
      args: ['run', 'check:release'],
    },
    {
      id: 'l3-vitest',
      label: 'L3 vitest (maxWorkers 1)',
      tier: 'light',
      command: 'bun',
      args: ['run', 'test'],
    },
  ];

  if (!options.lightOnly && !options.skipSql) {
    steps.push(
      {
        id: 'l5-stack-ensure',
        label: 'L5 ensure dev stack (Docker on-demand)',
        tier: 'heavy',
        command: 'tsx',
        args: ['scripts/ensure-dev-stack.ts', '--full', '--quiet', '--sql-gate'],
      },
      {
        id: 'l5-db-reset',
        label: 'L5 supabase db reset',
        tier: 'heavy',
        command: 'supabase',
        args: ['db', 'reset'],
        env: { PHONARA_KEEP_STACK: '1' },
      },
      {
        id: 'l5-sql',
        label: 'L5 test:sql',
        tier: 'heavy',
        command: 'bun',
        args: ['run', 'test:sql'],
        env: { PHONARA_KEEP_STACK: '1' },
      },
    );
  }

  if (!options.lightOnly && !options.skipE2e) {
    for (const spec of E2E_SPECS) {
      steps.push({
        id: spec.id,
        label: spec.label,
        tier: 'heavy',
        command: spec.command,
        args: spec.args,
        env: { PHONARA_KEEP_STACK: '1' },
      });
    }
    steps.push({
      id: 'l7-e2e-full',
      label: 'L7 test:e2e (full suite)',
      tier: 'heavy',
      command: 'bun',
      args: ['run', 'test:e2e'],
      env: { PHONARA_KEEP_STACK: '1' },
    });
  }

  steps.push({
    id: 'teardown-work-end',
    label: 'teardown cursor:work-end (full cleanup)',
    tier: 'light',
    command: 'bun',
    args: ['run', 'cursor:work-end'],
  });

  return steps;
}

function parseArgs(): CliOptions {
  const argv = process.argv.slice(2);
  let fromStep: string | null = null;
  for (const arg of argv) {
    if (arg.startsWith('--from=')) {
      fromStep = arg.slice('--from='.length) || null;
    }
  }
  return {
    fromStep,
    lightOnly: argv.includes('--light-only'),
    skipSql: argv.includes('--skip-sql'),
    skipE2e: argv.includes('--skip-e2e'),
    skipRemote: argv.includes('--skip-remote'),
  };
}

function childEnv(step: LocalTestStep): NodeJS.ProcessEnv {
  return {
    ...process.env,
    [ALLOW_ENV]: '1',
    ...step.env,
  };
}

function runStep(step: LocalTestStep): number {
  if (step.tier === 'heavy') {
    const ram = checkRam();
    process.stdout.write(`[gate:local-autopilot] ${ram.message}\n`);
    if (ram.verdict === 'critical') {
      process.stderr.write(
        `[gate:local-autopilot] ABORT before ${step.id} — free RAM then: ${buildResumeCommand(step.id)}\n`,
      );
      return 2;
    }
    if (ram.verdict === 'warn') {
      process.stdout.write('[gate:local-autopilot] warn: continuing — close extra apps if laggy\n');
    }
  }

  process.stdout.write(`\n[gate:local-autopilot] ▶ ${step.label} (${step.id})\n`);
  const result = spawnSyncSafe(step.command, [...step.args], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: childEnv(step),
  });
  const code = result.status ?? 1;
  if (code === 0) {
    process.stdout.write(`[gate:local-autopilot] ✓ ${step.id}\n`);
  } else {
    process.stderr.write(`[gate:local-autopilot] ✗ ${step.id} (exit ${code})\n`);
  }
  return code;
}

function updateReport(partial: Partial<LocalTestReport> & Pick<LocalTestReport, 'status'>): void {
  const now = new Date().toISOString();
  writeLocalTestReport({
    startedAt: partial.startedAt ?? now,
    updatedAt: now,
    status: partial.status,
    failedStepId: partial.failedStepId ?? null,
    failedStepLabel: partial.failedStepLabel ?? null,
    exitCode: partial.exitCode ?? null,
    errorMessage: partial.errorMessage ?? null,
    completedSteps: partial.completedSteps ?? [],
    remainingSteps: partial.remainingSteps ?? [],
    ramFreeMb: partial.ramFreeMb ?? checkRam().freeMb,
    resumeCommand: partial.resumeCommand ?? buildResumeCommand(partial.failedStepId ?? null),
  });
}

function main(): void {
  const options = parseArgs();
  const allSteps = buildSteps(options);
  const stepIds = allSteps.map((s) => s.id);
  let startIndex = 0;

  if (options.fromStep) {
    const idx = allSteps.findIndex((s) => s.id === options.fromStep);
    if (idx < 0) {
      process.stderr.write(
        `[gate:local-autopilot] unknown --from=${options.fromStep}. Valid: ${stepIds.join(', ')}\n`,
      );
      process.exit(1);
    }
    startIndex = idx;
    process.stdout.write(`[gate:local-autopilot] resume from ${options.fromStep}\n`);
  }

  const startedAt = new Date().toISOString();
  const completed: string[] = [];

  process.stdout.write(
    '[gate:local-autopilot] Local test ladder (low-spec · sequential · Docker on-demand)\n',
  );
  process.stdout.write(
    '[gate:local-autopilot] One terminal · one gate · foreground · G1 compliant\n\n',
  );

  updateReport({
    startedAt,
    status: 'running',
    failedStepId: null,
    failedStepLabel: null,
    exitCode: null,
    errorMessage: null,
    completedSteps: [],
    remainingSteps: stepIds.slice(startIndex),
    resumeCommand: buildResumeCommand(options.fromStep),
  });

  for (let i = startIndex; i < allSteps.length; i += 1) {
    const step = allSteps[i]!;
    const code = runStep(step);

    if (code !== 0) {
      const remaining = stepIds.slice(i);
      updateReport({
        startedAt,
        status: 'failed',
        failedStepId: step.id,
        failedStepLabel: step.label,
        exitCode: code,
        errorMessage: `Step ${step.id} failed with exit ${code}`,
        completedSteps: completed,
        remainingSteps: remaining,
        resumeCommand: buildResumeCommand(step.id),
      });
      process.stderr.write('\n[gate:local-autopilot] FAIL — AI fix loop:\n');
      process.stderr.write('  1. Read gate-manifest/local-test-report.json\n');
      process.stderr.write('  2. Fix the failing code/tests\n');
      process.stderr.write(`  3. ${buildResumeCommand(step.id)}\n`);
      process.stderr.write('  Or invoke @test-autopilot subagent\n');
      process.exit(code === 2 ? 2 : 1);
    }

    completed.push(step.id);
    updateReport({
      startedAt,
      status: 'running',
      failedStepId: null,
      failedStepLabel: null,
      exitCode: null,
      errorMessage: null,
      completedSteps: completed,
      remainingSteps: stepIds.slice(i + 1),
      resumeCommand: buildResumeCommand(stepIds[i + 1] ?? null),
    });

    if (step.tier === 'heavy' && step.id.startsWith('e2e-')) {
      sleepMs(1500);
    }
  }

  updateReport({
    startedAt,
    status: 'passed',
    failedStepId: null,
    failedStepLabel: null,
    exitCode: 0,
    errorMessage: null,
    completedSteps: completed,
    remainingSteps: [],
    resumeCommand: 'bun run gate:local-autopilot',
  });

  process.stdout.write('\n[gate:local-autopilot] ✓ ALL LOCAL TESTS PASSED\n');
  process.stdout.write('[gate:local-autopilot] quality · vitest · sql · e2e — green on this PC\n');
}

main();
