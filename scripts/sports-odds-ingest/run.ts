/// <reference types="node" />
import { loadRepoEnvFiles } from '../lib/load-repo-env';
import { readIngestEnv, runIngestWorker } from './worker';

loadRepoEnvFiles();

async function main(): Promise<void> {
  const config = readIngestEnv();
  await runIngestWorker(config);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
