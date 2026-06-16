/// <reference types="node" />
import { loadRepoEnvFiles } from '../lib/load-repo-env';
import { readWsIngestEnv, runWsIngestWorker } from './ws-worker';

loadRepoEnvFiles();

async function main(): Promise<void> {
  const config = readWsIngestEnv();
  await runWsIngestWorker(config);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
