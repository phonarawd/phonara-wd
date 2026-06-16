/// <reference types="node" />
import { loadRepoEnvFiles } from '../lib/load-repo-env';
import { readSettleEnv, runSettleWorker } from './worker';

loadRepoEnvFiles();

async function main(): Promise<void> {
  const config = readSettleEnv();
  const result = await runSettleWorker(config);
  console.info(
    `[sports-settle] done processed=${result.processed} skipped=${result.skipped} mismatches=${result.mismatches} vendor=${result.vendor}`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
