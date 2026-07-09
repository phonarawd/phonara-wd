import { killOrphanRepoDevProcesses } from './lib/cursor-dev-processes';
import { killE2ePortListeners } from './lib/e2e-lifecycle';

const killed = killOrphanRepoDevProcesses();
const ports = killE2ePortListeners();

if (killed > 0 || ports > 0) {
  process.stdout.write(
    `[cursor:kill-orphans] stopped ${killed} orphan dev process(es), freed ${ports} port listener(s)\n`,
  );
} else {
  process.stdout.write('[cursor:kill-orphans] no orphan dev processes or E2E port listeners\n');
}
