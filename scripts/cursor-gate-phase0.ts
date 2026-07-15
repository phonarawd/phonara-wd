/**
 * gate-phase0 — rollout safety gate after gate-diagnosis PASS.
 *
 *   bun run cursor:gate-phase0
 *   bun run cursor:gate-phase0 -- --force-gate-phase0
 */
import { parseForceGatePhase0Arg, runGatePhase0 } from './lib/gate-phase0-core';

function main(): void {
  const forceGatePhase0 = parseForceGatePhase0Arg(process.argv.slice(2));
  const result = runGatePhase0({ forceGatePhase0 });

  process.stdout.write('[cursor:gate-phase0] ');
  if (result.gate_status === 'pass') {
    process.stdout.write(result.ssot_forced ? 'PASS (forced)\n' : 'PASS\n');
  } else if (result.gate_status === 'fail') {
    process.stdout.write('FAIL\n');
  } else {
    process.stdout.write('AMBIGUOUS\n');
  }

  if (result.diagnosis_ref) {
    process.stdout.write(`[cursor:gate-phase0] diagnosis_ref: ${result.diagnosis_ref}\n`);
  }

  process.stdout.write(`[cursor:gate-phase0] ${result.message}\n`);

  if (result.gate_status === 'ambiguous') {
    process.stdout.write(
      '[cursor:gate-phase0] hint: review ACTIVE_WORK_SSOT then rerun with --force-gate-phase0\n',
    );
  }

  process.exit(result.exit);
}

main();
