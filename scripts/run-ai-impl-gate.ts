/**
 * AI autonomous "Implemented" gate (L0~L4 only · G13 compliant).
 * Single foreground terminal · no Docker · no E2E · no test:sql.
 *
 * Usage:
 *   bun run gate:ai-impl -- --test apps/web/src/features/wallet/__tests__
 *   bun run gate:ai-impl -- --test apps/web/src/components/trade apps/web/src/features/trading
 */
import { spawnSyncSafe } from './lib/spawn-safe';

interface GateStep {
  readonly name: string;
  readonly command: string;
  readonly args: readonly string[];
}

function parseArgs(): { testPaths: string[]; skipUiArch: boolean; skipVitest: boolean } {
  const argv = process.argv.slice(2);
  const testPaths: string[] = [];
  let skipUiArch = false;
  let skipVitest = false;

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--test') {
      while (i + 1 < argv.length && !argv[i + 1]!.startsWith('--')) {
        testPaths.push(argv[++i]!);
      }
      continue;
    }
    if (token === '--skip-ui-arch') {
      skipUiArch = true;
      continue;
    }
    if (token === '--skip-vitest') {
      skipVitest = true;
    }
  }

  return { testPaths, skipUiArch, skipVitest };
}

function runStep(step: GateStep): boolean {
  console.log(`\n[gate:ai-impl] ▶ ${step.name}`);
  const result = spawnSyncSafe(step.command, [...step.args], {
    cwd: process.cwd(),
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    console.error(`[gate:ai-impl] ✗ FAIL: ${step.name}`);
    return false;
  }
  console.log(`[gate:ai-impl] ✓ ${step.name}`);
  return true;
}

function main(): void {
  const { testPaths, skipUiArch, skipVitest } = parseArgs();
  const started = Date.now();

  const steps: GateStep[] = [
    { name: 'L0 cursor:status', command: 'bun', args: ['run', 'cursor:status'] },
    { name: 'L0 check:hygiene', command: 'bun', args: ['run', 'check:hygiene'] },
  ];

  if (!skipUiArch) {
    steps.push(
      {
        name: 'L0 check:ui-architecture',
        command: 'bun',
        args: ['run', 'check:ui-architecture'],
      },
      {
        name: 'L0 check:phase-r-guards',
        command: 'bun',
        args: ['run', 'check:phase-r-guards', '--', '--strict'],
      },
    );
  }

  steps.push(
    { name: 'L1 typecheck', command: 'bun', args: ['run', 'typecheck'] },
    { name: 'L2 lint', command: 'bun', args: ['run', 'lint'] },
    { name: 'L1 check:i18n', command: 'bun', args: ['run', 'check:i18n'] },
    { name: 'L1 check:release', command: 'bun', args: ['run', 'check:release'] },
  );

  if (!skipVitest) {
    if (testPaths.length === 0) {
      console.error(
        '[gate:ai-impl] ✗ FAIL: --test <vitest-path> [more...] required (or pass --skip-vitest for docs-only)',
      );
      process.exit(1);
    }
    steps.push({
      name: `L3 vitest ${testPaths.join(' ')}`,
      command: 'bun',
      args: ['run', 'test', '--', ...testPaths],
    });
  }

  for (const step of steps) {
    if (!runStep(step)) {
      process.exit(1);
    }
  }

  const seconds = Math.round((Date.now() - started) / 1000);
  console.log(
    `\n[gate:ai-impl] ✓ Implemented (L0~L4) green in ${seconds}s — operator/CI L5~L8 pending (80 G13)`,
  );
}

main();
