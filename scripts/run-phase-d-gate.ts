#!/usr/bin/env tsx
/**
 * Phase D — operator launch gate prep + manifest (AI prepares only · operator marks confirm flags).
 *
 * Automated prep (no operator external actions):
 *   phase R manifest read · remote prod layer · advisor 0 · edge verify · ops health · optional drills
 *
 * Operator-only (default operator_pending · pass via --confirm-* flags after external work):
 *   anon key rotate · prod Supabase separation · CI migration · legal/KYC/AML/RG
 *
 * Usage:
 *   bun run gate:phase-d
 *   bun run gate:phase-d -- --run-backup --run-gameday --run-load-smoke
 *   bun run gate:phase-d -- --confirm-d1 --confirm-d2 --confirm-d3 --confirm-d4 --confirm-d5 --confirm-d6 --confirm-d7
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadRepoEnvFiles } from './lib/load-repo-env';
import {
  DEFAULT_PHASE_D_MANIFEST_PATH,
  DEFAULT_PHASE_R_MANIFEST_PATH,
  PhaseDManifestCollector,
  printPhaseDSummary,
  readPhaseRManifestSnapshot,
  type PhaseDStepName,
} from './lib/phase-d-manifest';
import { collectRemoteProdLayer } from './lib/remote-prod-layer';
import { readAccessTokenFromEnvFiles } from './lib/supabase-auth';
import { spawnSyncSafe } from './lib/spawn-safe';

loadRepoEnvFiles();

interface CliOptions {
  manifestPath: string;
  phaseRManifestPath: string;
  runBackup: boolean;
  runGameday: boolean;
  runLoadSmoke: boolean;
  skipEdge: boolean;
  confirm: Set<PhaseDStepName>;
}

const CONFIRM_FLAG_MAP: Record<string, PhaseDStepName> = {
  'confirm-d1': 'anonKeyRotate',
  'confirm-d2': 'ciMigration',
  'confirm-d3': 'prodSupabaseSeparation',
  'confirm-d4': 'killSwitchRehearsal',
  'confirm-d5': 'backupRehearsal',
  'confirm-d6': 'observabilityDr',
  'confirm-d7': 'legalCompliance',
};

function parseArgs(): CliOptions {
  const argv = process.argv.slice(2);
  const confirm = new Set<PhaseDStepName>();
  for (const arg of argv) {
    const key = arg.replace(/^--/, '');
    const mapped = CONFIRM_FLAG_MAP[key];
    if (mapped) confirm.add(mapped);
  }
  return {
    manifestPath:
      argv.find((a) => a.startsWith('--manifest='))?.slice('--manifest='.length) ??
      DEFAULT_PHASE_D_MANIFEST_PATH,
    phaseRManifestPath:
      argv.find((a) => a.startsWith('--phase-r-manifest='))?.slice('--phase-r-manifest='.length) ??
      DEFAULT_PHASE_R_MANIFEST_PATH,
    runBackup: argv.includes('--run-backup'),
    runGameday: argv.includes('--run-gameday'),
    runLoadSmoke: argv.includes('--run-load-smoke'),
    skipEdge: argv.includes('--skip-edge'),
    confirm,
  };
}

function runSyncStep(
  label: string,
  command: string,
  args: string[],
  env?: NodeJS.ProcessEnv,
): void {
  process.stdout.write(`\n[gate:phase-d] ▶ ${label}\n`);
  const result = spawnSyncSafe(command, args, {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: env ? { ...process.env, ...env } : process.env,
  });
  if (result.status !== 0) {
    throw new Error(`[gate:phase-d] ${label} failed (exit ${result.status ?? 'unknown'})`);
  }
}

async function runOptionalStep(
  manifest: PhaseDManifestCollector,
  name: PhaseDStepName,
  owner: 'automated' | 'operator',
  runbookSection: string,
  run: () => Promise<void>,
  onFail: () => void,
): Promise<void> {
  try {
    await manifest.recordRun(name, owner, run, runbookSection);
  } catch {
    onFail();
  }
}

async function main(): Promise<void> {
  const options = parseArgs();
  const manifest = new PhaseDManifestCollector();
  let exitCode = 0;

  process.stdout.write(
    '[gate:phase-d] Phase D launch gate prep (automated + operator_pending manifest)\n',
  );

  try {
    runSyncStep('L0 cursor:status', 'bun', ['run', 'cursor:status']);

    const phaseR = readPhaseRManifestSnapshot(options.phaseRManifestPath);
    manifest.setPhaseRPrerequisite(phaseR);
    if (!phaseR) {
      manifest.record(
        'phaseRPrerequisite',
        'fail',
        0,
        'automated',
        undefined,
        `missing ${options.phaseRManifestPath} — run gate:phase-r first`,
        '§0 Prerequisites',
      );
      exitCode = 1;
    } else if (!phaseR.releaseReady) {
      manifest.record(
        'phaseRPrerequisite',
        'fail',
        0,
        'automated',
        `${options.phaseRManifestPath} releaseReady=false`,
        'Phase R not green',
        '§0 Prerequisites',
      );
      exitCode = 1;
    } else {
      manifest.record(
        'phaseRPrerequisite',
        'pass',
        0,
        'automated',
        `${options.phaseRManifestPath} releaseReady=true commit=${phaseR.commitShort ?? '?'}`,
        undefined,
        '§0 Prerequisites',
      );
    }

    const token = readAccessTokenFromEnvFiles();
    const remoteLayer = await collectRemoteProdLayer(token);

    await runOptionalStep(
      manifest,
      'remoteProdLayer',
      'automated',
      '§3 Prod separation',
      async () => {
        if (remoteLayer.skipped) {
          throw new Error(remoteLayer.reason ?? 'remote prod layer skipped');
        }
        if (!remoteLayer.migrationListOk) {
          throw new Error(remoteLayer.migrationListError ?? 'migration list failed');
        }
        if (remoteLayer.migrationParity === false) {
          throw new Error('migration parity check failed — run stack:push-remote');
        }
      },
      () => {
        exitCode = 1;
      },
    );

    await runOptionalStep(
      manifest,
      'securityAdvisor',
      'automated',
      '§3 Prod separation',
      async () => {
        if (remoteLayer.skipped) throw new Error('no token');
        const errors = remoteLayer.securityAdvisorErrors ?? -1;
        if (errors !== 0) {
          throw new Error(`security advisor ERROR count=${errors}`);
        }
      },
      () => {
        exitCode = 1;
      },
    );

    if (options.skipEdge || !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
      manifest.record(
        'edgeFunctions',
        'skip',
        0,
        'automated',
        options.skipEdge ? '--skip-edge' : 'no SUPABASE_SERVICE_ROLE_KEY',
        undefined,
        '§6 Observability',
      );
    } else {
      await runOptionalStep(
        manifest,
        'edgeFunctions',
        'automated',
        '§6 Observability',
        async () => {
          runSyncStep('edge stack:verify-worldno1-edge', 'bun', [
            'run',
            'stack:verify-worldno1-edge',
          ]);
        },
        () => {
          exitCode = 1;
        },
      );
    }

    await runOptionalStep(
      manifest,
      'opsHealth',
      'automated',
      '§6 Observability',
      async () => {
        if (remoteLayer.skipped) throw new Error('no token');
        if (!remoteLayer.opsHealth) {
          throw new Error('rpc_ops_health_summary returned no data');
        }
        if (remoteLayer.reconciliationOk === false) {
          throw new Error(
            `reconciliation not ok: ${remoteLayer.reconciliationDetail ?? 'unknown'}`,
          );
        }
      },
      () => {
        exitCode = 1;
      },
    );

    const lastRehearsal = join(process.cwd(), 'backups', 'last-rehearsal.json');
    const gamedayReport = join(process.cwd(), 'gate-manifest', 'gameday-report.json');
    if (existsSync(lastRehearsal) || existsSync(gamedayReport)) {
      manifest.record(
        'observabilityDr',
        'pass',
        0,
        'automated',
        [
          existsSync(lastRehearsal) ? 'backups/last-rehearsal.json' : null,
          existsSync(gamedayReport) ? 'gate-manifest/gameday-report.json' : null,
        ]
          .filter(Boolean)
          .join(' · '),
        undefined,
        '§6 Observability',
      );
    } else {
      manifest.markOperatorPending(
        'observabilityDr',
        '§6 Observability',
        'configure alerts/dashboards · run stack:verify-worldno1-edge · optional load-smoke',
      );
    }

    if (options.confirm.has('backupRehearsal')) {
      manifest.confirmOperatorStep('backupRehearsal', 'operator --confirm-d5');
    } else if (options.runBackup) {
      await runOptionalStep(
        manifest,
        'backupRehearsal',
        'automated',
        '§5 Backup',
        async () => {
          runSyncStep('D5 rehearsal:backup', 'bun', ['run', 'rehearsal:backup']);
        },
        () => {
          exitCode = 1;
        },
      );
    } else {
      manifest.markOperatorPending(
        'backupRehearsal',
        '§5 Backup',
        'bun run rehearsal:backup or remote PITR drill per RUNBOOK §3',
      );
    }

    if (options.confirm.has('killSwitchRehearsal')) {
      manifest.confirmOperatorStep('killSwitchRehearsal', 'operator --confirm-d4');
    } else if (options.runGameday) {
      await runOptionalStep(
        manifest,
        'killSwitchRehearsal',
        'automated',
        '§4 Ops rehearsal',
        async () => {
          runSyncStep('D4 gameday:drill', 'bun', ['run', 'gameday:drill']);
        },
        () => {
          exitCode = 1;
        },
      );
    } else {
      manifest.markOperatorPending(
        'killSwitchRehearsal',
        '§4 Ops rehearsal',
        'bun run gameday:drill · admin kill switch + withdrawal approve/reject E2E',
      );
    }

    if (options.runLoadSmoke) {
      await runOptionalStep(
        manifest,
        'loadSmoke',
        'automated',
        '§6 Observability',
        async () => {
          runSyncStep('h6 load-smoke', 'bun', ['run', 'load-smoke'], { PHONARA_KEEP_STACK: '1' });
        },
        () => {
          exitCode = 1;
        },
      );
    } else {
      manifest.record(
        'loadSmoke',
        'skip',
        0,
        'automated',
        'optional — --run-load-smoke',
        undefined,
        '§6 Observability',
      );
    }

    if (options.confirm.has('anonKeyRotate')) {
      manifest.confirmOperatorStep('anonKeyRotate', 'operator --confirm-d1');
    } else {
      manifest.markOperatorPending(
        'anonKeyRotate',
        '§1 Anon key rotate',
        'Supabase Dashboard → Settings → API → rotate anon key · redeploy web/admin env',
      );
    }

    if (options.confirm.has('prodSupabaseSeparation')) {
      manifest.confirmOperatorStep('prodSupabaseSeparation', 'operator --confirm-d3');
    } else {
      manifest.markOperatorPending(
        'prodSupabaseSeparation',
        '§3 Prod separation',
        'prod project lock yocjhjsdwoijfdrehzoq · local .env ≠ prod secrets · RLS smoke',
      );
    }

    if (options.confirm.has('ciMigration')) {
      manifest.confirmOperatorStep('ciMigration', 'operator --confirm-d2');
    } else {
      manifest.markOperatorPending(
        'ciMigration',
        '§2 CI migration',
        'CI repo green: bun run gate:phase-r · test:e2e full · upload phase-r-manifest artifact',
      );
    }

    if (options.confirm.has('legalCompliance')) {
      manifest.confirmOperatorStep('legalCompliance', 'operator --confirm-d7');
    } else {
      manifest.markOperatorPending(
        'legalCompliance',
        '§7 Legal',
        'KYC/AML/RG policy sign-off · jurisdiction · responsible gaming — operator/legal only',
      );
    }

    if (options.confirm.has('observabilityDr')) {
      manifest.confirmOperatorStep('observabilityDr', 'operator --confirm-d6');
    }

    const finalManifest = manifest.finalize();
    const path = manifest.writeManifest(finalManifest, options.manifestPath);
    printPhaseDSummary(finalManifest);

    process.stdout.write(`\n[gate:phase-d] manifest → ${path}\n`);
    if (!finalManifest.prepReady) {
      exitCode = 1;
    }
  } catch (error) {
    exitCode = 1;
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`\n[gate:phase-d] ✗ FAIL: ${message}\n`);
    try {
      const path = manifest.writeFinal(options.manifestPath);
      printPhaseDSummary(manifest.finalize());
      process.stderr.write(`[gate:phase-d] manifest written (failed run) → ${path}\n`);
    } catch {
      /* best-effort */
    }
  }

  if (exitCode === 0) {
    const final = manifest.finalize();
    if (final.launchReady) {
      process.stdout.write(
        '[gate:phase-d] ✓ launchReady=true — operator confirmed all D1~D7 gates\n',
      );
    } else if (final.prepReady) {
      process.stdout.write(
        '[gate:phase-d] ✓ prepReady — automated checks green · complete operator D1~D7 then re-run with --confirm-*\n',
      );
    }
  }

  process.exit(exitCode);
}

main();
