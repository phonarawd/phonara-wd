/**
 * perf-rollout — v4.4 diagnosis-first orchestrator.
 *
 *   bun run cursor:perf-rollout
 *   bun run cursor:perf-rollout -- --confirm-high-remediation
 *   bun run cursor:perf-rollout -- --include-tsserver-tuning
 *   bun run cursor:perf-rollout -- --from=high-remediation
 */
import {
  buildPerfRolloutStepOrder,
  parseIncludeTsserverTuningArg,
  runPerfRollout,
} from './lib/perf-rollout-core';

function main(): void {
  const argv = process.argv.slice(2);
  const includeTsserverTuning = parseIncludeTsserverTuningArg(argv);
  const steps = buildPerfRolloutStepOrder({ includeTsserverTuning });

  process.stdout.write(
    `[cursor:perf-rollout] steps=${steps.join(' → ')} · tsserver_tuning=${includeTsserverTuning ? 'on' : 'off'}\n`,
  );

  const result = runPerfRollout({ argv });

  if (result.summary_line) {
    process.stdout.write(`${result.summary_line}\n`);
  }

  process.stdout.write(`[cursor:perf-rollout] ${result.message}\n`);

  if (result.stopped_at) {
    process.stdout.write(`[cursor:perf-rollout] stopped at ${result.stopped_at}\n`);
  }

  process.exit(result.exit);
}

main();
