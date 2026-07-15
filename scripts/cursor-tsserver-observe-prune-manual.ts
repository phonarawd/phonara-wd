/**
 * prune-manual — manual rows only during observation window; full rename only when safe.
 *
 *   bun run cursor:tsserver-observe:prune-manual
 */
import {
  formatObserveJsonlSummaryLine,
  pruneManualObserveJsonl,
  readObserveJsonlEntries,
  summarizeObserveJsonl,
  tsserverObserveJsonlPath,
} from './lib/tsserver-observe-core';
import { existsSync, statSync } from 'node:fs';

function main(): void {
  const filePath = tsserverObserveJsonlPath();
  const fileBytes = existsSync(filePath) ? statSync(filePath).size : 0;
  const result = pruneManualObserveJsonl({}, filePath);
  const counts = summarizeObserveJsonl(readObserveJsonlEntries(filePath), fileBytes);

  process.stdout.write(`[cursor:tsserver-observe:prune-manual] action=${result.action}\n`);
  process.stdout.write(`[cursor:tsserver-observe:prune-manual] ${result.message}\n`);
  process.stdout.write(`${formatObserveJsonlSummaryLine(counts)}\n`);
}

main();
