/**
 * high-remediation — diagnosis-based RAM/orphan guidance (dry-run default).
 *
 *   bun run cursor:high-remediation
 *   bun run cursor:high-remediation -- --confirm-high-remediation
 */
import { parseConfirmHighRemediationArg, runHighRemediation } from './lib/high-remediation-core';

const confirm = parseConfirmHighRemediationArg(process.argv.slice(2));
const result = runHighRemediation({ confirmHighRemediation: confirm });

process.stdout.write(`${result.message}\n`);
if (result.remediation_path) {
  process.stdout.write(`[cursor:high-remediation] remediation: ${result.remediation_path}\n`);
}

if (!confirm) {
  process.stdout.write(
    '[cursor:high-remediation] dry-run only — pass --confirm-high-remediation to run cursor:emergency-reset (purge never auto-called)\n',
  );
}

process.exit(result.exit);
