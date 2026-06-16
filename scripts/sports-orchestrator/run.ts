/// <reference types="node" />
import { loadRepoEnvFiles } from '../lib/load-repo-env';
import { readOrchestratorEnv, runSportsOrchestrator } from './orchestrator';

loadRepoEnvFiles();

async function main(): Promise<void> {
  const config = readOrchestratorEnv();
  await runSportsOrchestrator(config);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
