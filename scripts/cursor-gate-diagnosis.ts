/**
 * gate-diagnosis — rollout step #0 · Max Context gate · RAM/process snapshot.
 *
 *   bun run cursor:gate-diagnosis
 *   bun run cursor:gate-diagnosis -- --attest-max-context=6k
 */
import { parseAttestMaxContextArg, runGateDiagnosis } from './lib/gate-diagnosis-core';

function main(): void {
  const attestMaxContext = parseAttestMaxContextArg(process.argv.slice(2));
  const result = runGateDiagnosis({ attestMaxContext });

  process.stdout.write('[cursor:gate-diagnosis] ');
  if (result.gate_status === 'pass') {
    process.stdout.write('PASS\n');
  } else if (result.gate_status === 'fail') {
    process.stdout.write('FAIL — Max Context 200k blocks rollout\n');
  } else {
    process.stdout.write('AMBIGUOUS — Max Context unverified or evidence expired\n');
  }

  if (result.diagnosis_path) {
    process.stdout.write(`[cursor:gate-diagnosis] diagnosis: ${result.diagnosis_path}\n`);
  }

  if (result.diagnosis) {
    process.stdout.write(
      `[cursor:gate-diagnosis] dominant=${result.diagnosis.dominant_ram_consumer} · severity=${result.diagnosis.severity} · high=${JSON.stringify(result.diagnosis.high_reasons)}\n`,
    );
    process.stdout.write(
      `[cursor:gate-diagnosis] max_context=${result.diagnosis.max_context} (${result.diagnosis.max_context_source})\n`,
    );
  }

  if (result.summary_line) {
    process.stdout.write(`${result.summary_line}\n`);
  }

  if (result.gate_status === 'ambiguous') {
    process.stdout.write(
      '[cursor:gate-diagnosis] hint: submit .cursor/perf/max-context-evidence.json or run with --attest-max-context=6k\n',
    );
  }

  process.exit(result.exit);
}

main();
