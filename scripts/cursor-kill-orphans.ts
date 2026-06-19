import { killOrphanRepoDevProcesses } from './lib/cursor-dev-processes';

const killed = killOrphanRepoDevProcesses();
if (killed > 0) {
  process.stdout.write(
    `[cursor:kill-orphans] stopped ${killed} orphan dev process(es)\n`,
  );
} else {
  process.stdout.write('[cursor:kill-orphans] no orphan dev processes\n');
}
