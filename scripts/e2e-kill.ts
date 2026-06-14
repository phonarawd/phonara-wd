import { getBlockedE2ePorts, killE2ePortListeners } from './lib/e2e-lifecycle';

const killed = killE2ePortListeners();
if (killed > 0) {
  process.stdout.write(`[e2e:kill] stopped ${killed} listener process(es)\n`);
} else {
  process.stdout.write('[e2e:kill] no listeners on E2E ports (3000, 3001, 3002)\n');
}

const blocked = getBlockedE2ePorts();
if (blocked.length > 0) {
  process.stderr.write(
    `[e2e:kill] ports still blocked: ${blocked.join(', ')} — retry or reboot if stuck\n`,
  );
  process.exit(1);
}
