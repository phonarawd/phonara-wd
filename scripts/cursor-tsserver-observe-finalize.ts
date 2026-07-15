/**
 * Finalize tsserver trial — aggregates scheduled observe samples and clears schtasks.
 *
 *   bun run cursor:tsserver-observe:finalize
 */
import { deleteAllPerfObserveTasks } from './lib/schtasks-lifecycle';
import {
  filterScheduledFinalizeEntries,
  formatObserveJsonlSummaryLine,
  readObserveJsonlEntries,
  readRolloutState,
  summarizeObserveJsonl,
  writeRolloutState,
} from './lib/tsserver-observe-core';

function main(): void {
  const rollout = readRolloutState();
  const windowStart = rollout.state?.observe_window_start;
  if (!windowStart) {
    process.stderr.write(
      '[cursor:tsserver-observe:finalize] blocked — observe_window_start missing\n',
    );
    process.exit(1);
  }

  if (rollout.state?.finalize_completed_at) {
    process.stdout.write(
      `[cursor:tsserver-observe:finalize] already finalized at ${rollout.state.finalize_completed_at}\n`,
    );
    process.exit(0);
  }

  const entries = readObserveJsonlEntries();
  const scheduled = filterScheduledFinalizeEntries(entries, windowStart);
  const counts = summarizeObserveJsonl(entries);
  const finalizedAt = new Date().toISOString();

  writeRolloutState({
    ...rollout.state,
    observe_window_start: windowStart,
    finalize_completed_at: finalizedAt,
  });

  const tasks = deleteAllPerfObserveTasks();
  process.stdout.write(
    `[cursor:tsserver-observe:finalize] window=${windowStart} · scheduled_samples=${scheduled.length} · finalized_at=${finalizedAt}\n`,
  );
  process.stdout.write(`${formatObserveJsonlSummaryLine(counts)}\n`);
  process.stdout.write(
    `[cursor:tsserver-observe:finalize] schtasks deleted=${tasks.deleted.join(',') || 'none'} skipped=${tasks.skipped.join(',') || 'none'}\n`,
  );
}

main();
