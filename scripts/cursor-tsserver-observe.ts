/**
 * Append one tsserver observe JSONL row — source from PHONARA_TSSERVER_OBSERVE_SOURCE (default manual).
 *
 *   bun run cursor:tsserver-observe
 */
import { existsSync, statSync } from 'node:fs';
import {
  appendObserveJsonlEntry,
  formatObserveJsonlSummaryLine,
  pruneManualObserveJsonl,
  readObserveJsonlEntries,
  resolveObserveSource,
  summarizeObserveJsonl,
  tsserverObserveJsonlPath,
} from './lib/tsserver-observe-core';

function main(): void {
  const source = resolveObserveSource();
  const ts_at = new Date().toISOString();
  const filePath = tsserverObserveJsonlPath();

  appendObserveJsonlEntry({ source, ts_at }, filePath);
  const prune = pruneManualObserveJsonl({}, filePath);
  const fileBytes = existsSync(filePath) ? statSync(filePath).size : 0;
  const counts = summarizeObserveJsonl(readObserveJsonlEntries(filePath), fileBytes);

  process.stdout.write(`[cursor:tsserver-observe] appended source=${source} ts=${ts_at}\n`);
  process.stdout.write(`${formatObserveJsonlSummaryLine(counts)}\n`);
  if (prune.action !== 'noop') {
    process.stdout.write(`[cursor:tsserver-observe] ${prune.message}\n`);
  }
}

main();
