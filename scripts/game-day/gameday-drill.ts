#!/usr/bin/env tsx
/**
 * PHONARA Game Day Drill — operational reliability (local Supabase only).
 * Drills 0–6: kill switches, partial gates, permissions, backup restore, Σ=0.
 */
import { spawnSync } from 'node:child_process';
import { adminClient, loadPentestConfig } from '../pentest/lib/config.ts';
import { createPentestFixture } from '../pentest/lib/fixture.ts';
import {
  getCurrencyTotals,
  getOrphanLocks,
  getPerWalletDrift,
  hasNegativeBalances,
  runInvariantChecks,
  runReconciliation,
} from '../pentest/lib/verify.ts';
import { EMERGENCY_LEVER_INVENTORY } from './lib/inventory.ts';
import {
  clearSolvencyHold,
  ensureLivePlatform,
  readAppConfig,
  setFeatureEnabled,
  setPerGameEnabled,
  setSystemMode,
  triggerSolvencyHold,
} from './lib/levers.ts';
import {
  placeDiceBet,
  probeWalletRead,
  readParityHoldFlag,
  rejectPendingWithdrawals,
  requestSmallWithdrawal,
  runMoneyProbeMatrix,
  triggerParityHold,
  tryUserRpc,
  type ProbeResult,
} from './lib/probes.ts';
import {
  createGamedayReportBuilder,
  defaultRunbook,
  printGamedayReport,
  snapshotMeasurements,
  writeGamedayReport,
} from './lib/report.ts';
import {
  capturePreRestoreSnapshot,
  createLocalDump,
  evaluateRestoreDrill,
  restoreFromDump,
  waitForDbReady,
} from './lib/restore-drill.ts';
import { captureSnapshot } from './lib/snapshot.ts';
import { sqlAsAdminAal1, sqlAsUser, sqlExec } from './lib/sql-claims.ts';
import { seedOracleAndMarkets } from '../pentest/lib/deposit-path.ts';
import type { PentestFixture } from '../pentest/lib/fixture.ts';
import type { PentestConfig } from '../pentest/lib/config.ts';

function haltLeaks(probes: ProbeResult[]): ProbeResult[] {
  return probes.filter((p) => p.expected === 'reject' && p.ok);
}

function probesPass(probes: ProbeResult[]): boolean {
  return probes.every((p) => p.passed);
}

const RECOVERY_CORE_PROBES = new Set(['game_bet', 'withdrawal_request', 'deposit_request']);

function recoveryProbesPass(probes: ProbeResult[]): boolean {
  return probes.filter((p) => RECOVERY_CORE_PROBES.has(p.name)).every((p) => p.passed);
}

function resetLocalDbAfterFailedRestore(): void {
  console.warn('[gameday] drill 5 restore failed — supabase db reset for drill 6 baseline');
  spawnSync('supabase', ['db', 'reset', '--yes'], { encoding: 'utf8', shell: true });
  waitForDbReady(180);
}

async function runDrill1Halt(
  config: PentestConfig,
  fixture: PentestFixture,
): Promise<{
  verdict: 'pass' | 'fail';
  summary: string;
  measurements: Record<string, string | number | boolean>;
  probes: ProbeResult[];
  citations: string[];
}> {
  ensureLivePlatform();
  await rejectPendingWithdrawals(fixture.adminId, fixture.userA.id);

  const betBaseline = await placeDiceBet(config, fixture, 'd1-baseline-bet');
  const wdBaseline = await requestSmallWithdrawal(config, fixture, 'd1-baseline-wd');
  const snapBeforeHalt = captureSnapshot(fixture.userA.id);
  const sigmaBefore = getCurrencyTotals();

  const haltOn = setSystemMode(fixture.adminId, true, false, 'gameday drill 1 halt');
  if (!haltOn.ok) {
    return {
      verdict: 'fail',
      summary: `halt ON failed: ${haltOn.error}`,
      measurements: { betBaseline: betBaseline.ok, wdBaseline: wdBaseline.ok },
      probes: [],
      citations: ['supabase/migrations/20260609000018_p0_system_live_guard.sql:69-106'],
    };
  }

  const blockProbes = await runMoneyProbeMatrix(
    config,
    fixture,
    'reject',
    wdBaseline.withdrawalId,
  );
  const haltLeaksList = haltLeaks(blockProbes);

  const haltOff = setSystemMode(fixture.adminId, false, false, 'gameday drill 1 recovery');
  if (!haltOff.ok) {
    return {
      verdict: 'fail',
      summary: `halt OFF failed: ${haltOff.error}`,
      measurements: { haltLeaks: haltLeaks.length },
      probes: blockProbes,
      citations: ['supabase/migrations/20260609000018_p0_system_live_guard.sql:69-106'],
    };
  }

  ensureLivePlatform();
  await rejectPendingWithdrawals(fixture.adminId, fixture.userA.id);

  const betRecovery = await placeDiceBet(config, fixture, 'd1-recovery-bet');
  const wdRecovery = await requestSmallWithdrawal(config, fixture, 'd1-recovery-wd');
  const recoveryProbes = await runMoneyProbeMatrix(config, fixture, 'allow');

  const drift = getPerWalletDrift();
  const sigmaAfter = getCurrencyTotals();
  const orphanLocks = getOrphanLocks(fixture.userA.id);
  const neg = hasNegativeBalances();

  const pass =
    betBaseline.ok &&
    wdBaseline.ok &&
    haltLeaksList.length === 0 &&
    probesPass(blockProbes) &&
    betRecovery.ok &&
    wdRecovery.ok &&
    recoveryProbesPass(recoveryProbes) &&
    drift.length === 0 &&
    !neg.found &&
    orphanLocks === 0;

  return {
    verdict: pass ? 'pass' : 'fail',
    summary: pass
      ? 'halt ON 전면 차단 + OFF 복구 OK'
      : `halt leak=${haltLeaksList.length} recoveryBet=${betRecovery.ok} drift=${drift.length} orphan=${orphanLocks}`,
    measurements: {
      bet_baseline: betBaseline.ok,
      wd_baseline: wdBaseline.ok,
      halt_leaks: haltLeaksList.length,
      block_probes_pass: probesPass(blockProbes),
      bet_recovery: betRecovery.ok,
      wd_recovery: wdRecovery.ok,
      drift_rows: drift.length,
      orphan_locks: orphanLocks,
      sigma_phon_before: sigmaBefore?.PHON ?? 'n/a',
      sigma_phon_after: sigmaAfter?.PHON ?? 'n/a',
      ...snapshotMeasurements(snapBeforeHalt),
    },
    probes: [...blockProbes, ...recoveryProbes],
    citations: [
      'supabase/migrations/20260609000018_p0_system_live_guard.sql:43-106',
      'supabase/migrations/20260609000033_s1_phase5_deposits_withdrawals.sql:737',
      'supabase/migrations/20260611000063_withdrawal_admin_guard_and_deposit_lock.sql:24',
    ],
  };
}

async function runDrill2Readonly(
  config: PentestConfig,
  fixture: PentestFixture,
): Promise<{
  verdict: 'pass' | 'fail';
  summary: string;
  measurements: Record<string, string | number | boolean>;
  probes: ProbeResult[];
  citations: string[];
}> {
  ensureLivePlatform();
  await rejectPendingWithdrawals(fixture.adminId, fixture.userA.id);

  const roOn = setSystemMode(fixture.adminId, false, true, 'gameday drill 2 readonly');
  if (!roOn.ok) {
    return {
      verdict: 'fail',
      summary: `readonly ON failed: ${roOn.error}`,
      measurements: {},
      probes: [],
      citations: ['supabase/migrations/20260609000018_p0_system_live_guard.sql:59-61'],
    };
  }

  const readProbe = probeWalletRead(fixture.userA.id);
  const blockProbes = await runMoneyProbeMatrix(config, fixture, 'reject');
  const roLeaksList = haltLeaks(blockProbes);

  void setSystemMode(fixture.adminId, false, false, 'gameday drill 2 recovery');
  ensureLivePlatform();

  const recoveryProbes = await runMoneyProbeMatrix(config, fixture, 'allow');
  const pass =
    readProbe.passed &&
    roLeaksList.length === 0 &&
    probesPass(blockProbes) &&
    recoveryProbesPass(recoveryProbes);

  return {
    verdict: pass ? 'pass' : 'fail',
    summary: pass
      ? 'readonly: 조회 OK, 자금이동 차단, 복구 OK'
      : `readonly leak=${roLeaksList.length} readOk=${readProbe.passed}`,
    measurements: {
      wallet_read_ok: readProbe.passed,
      money_block_ok: probesPass(blockProbes),
      readonly_leaks: roLeaksList.length,
      recovery_ok: recoveryProbesPass(recoveryProbes),
      system_readonly: readAppConfig('system_readonly') ?? 'n/a',
    },
    probes: [readProbe, ...blockProbes, ...recoveryProbes],
    citations: ['supabase/migrations/20260609000018_p0_system_live_guard.sql:59-61'],
  };
}

async function runDrill3Partial(
  config: PentestConfig,
  fixture: PentestFixture,
): Promise<{
  verdict: 'pass' | 'fail';
  summary: string;
  measurements: Record<string, string | number | boolean>;
  probes: ProbeResult[];
  citations: string[];
}> {
  ensureLivePlatform();
  await rejectPendingWithdrawals(fixture.adminId, fixture.userA.id);
  const allProbes: ProbeResult[] = [];
  const failures: string[] = [];

  // 3a withdrawal only OFF
  setFeatureEnabled(fixture.adminId, 'withdrawal', false, 'gameday drill 3a');
  const wdBlock = await tryUserRpc(config, fixture.userA.accessToken, 'rpc_request_withdrawal', {
    p_currency: 'PHON',
    p_amount: '25.000000',
    p_destination: {},
    p_idempotency_key: `gameday-3a-wd-${Date.now()}`,
  });
  const wdProbe: ProbeResult = {
    name: 'withdrawal_gate_off',
    rpc: 'rpc_request_withdrawal',
    actor: 'userA',
    expected: 'reject',
    passed: !wdBlock.ok,
    ok: wdBlock.ok,
    error: wdBlock.error,
    responseSnippet: wdBlock.error,
    citation: 'supabase/migrations/20260609000019_p0_feature_kill_switches.sql:62-105',
  };
  allProbes.push(wdProbe);
  if (!wdProbe.passed) failures.push('3a withdrawal not blocked');

  const betWhileWdOff = await placeDiceBet(config, fixture, 'd3a-bet');
  if (!betWhileWdOff.ok) failures.push('3a bet blocked (over-block)');

  setFeatureEnabled(fixture.adminId, 'withdrawal', true, 'gameday drill 3a recovery');
  const wdRecovery = await requestSmallWithdrawal(config, fixture, 'd3a-recovery');
  await rejectPendingWithdrawals(fixture.adminId, fixture.userA.id);
  if (!wdRecovery.ok) failures.push('3a withdrawal recovery failed');

  // 3b parity_hold
  ensureLivePlatform();
  sqlExec(`UPDATE app_config SET value = 'true' WHERE key = 'feature_game_dice_enabled';`);
  const parity = await triggerParityHold(config, fixture);
  const diceFlag = readParityHoldFlag('dice');
  if (!parity.ok) failures.push(`3b parity_hold: ${parity.error}`);
  if (diceFlag !== 'false') failures.push(`3b dice flag not auto-off: ${diceFlag}`);

  sqlExec(`UPDATE app_config SET value = 'true' WHERE key = 'feature_game_dice_enabled';`);
  await placeDiceBet(config, fixture, 'd3b-after-restore');
  // mines test in 3c — use dice for "other" after parity on dice only
  setPerGameEnabled('dice', true);

  // 3c mines only OFF (per-game app_config — no rpc_set_feature_enabled)
  setPerGameEnabled('mines', false);
  seedOracleAndMarkets();
  const minesOpen = await tryUserRpc(config, fixture.userA.accessToken, 'rpc_open_game_round', {
    p_game: 'mines',
  });
  let minesBetOk = false;
  if (minesOpen.ok && minesOpen.data) {
    const minesRound = (minesOpen.data as Record<string, unknown>)['round_id'];
    const minesBet = await tryUserRpc(config, fixture.userA.accessToken, 'rpc_place_game_bet', {
      p_round_id: minesRound,
      p_currency: 'PHON',
      p_stake: '10.000000',
      p_selection: { mineCount: 3, revealedCells: [0] },
      p_client_seed: 'gameday-mines-off',
      p_idempotency_key: `gameday-mines-off-${Date.now()}`,
    });
    minesBetOk = minesBet.ok;
  }
  const minesProbe: ProbeResult = {
    name: 'mines_only_off',
    rpc: 'rpc_place_game_bet(mines)',
    actor: 'userA',
    expected: 'reject',
    passed: !minesBetOk,
    ok: minesBetOk,
    error: minesBetOk ? 'bet succeeded when mines disabled' : 'blocked',
    responseSnippet: String(minesBetOk),
    citation: 'supabase/migrations/20260609000029_s3_casino_atomic_settlement.sql:82-98',
  };
  allProbes.push(minesProbe);
  if (!minesProbe.passed) failures.push('3c mines not blocked');

  const diceWhileMinesOff = await placeDiceBet(config, fixture, 'd3c-dice');
  if (!diceWhileMinesOff.ok) failures.push('3c dice blocked (over-block)');
  setPerGameEnabled('mines', true);

  // 3d solvency hold
  clearSolvencyHold();
  triggerSolvencyHold();
  const solvWd = await tryUserRpc(config, fixture.userA.accessToken, 'rpc_request_withdrawal', {
    p_currency: 'PHON',
    p_amount: '25.000000',
    p_destination: {},
    p_idempotency_key: `gameday-3d-solv-${Date.now()}`,
  });
  const solvProbe: ProbeResult = {
    name: 'solvency_hold',
    rpc: 'rpc_request_withdrawal',
    actor: 'userA',
    expected: 'reject',
    passed: !solvWd.ok && solvWd.error.includes('withdrawal_solvency_hold'),
    ok: solvWd.ok,
    error: solvWd.error,
    responseSnippet: solvWd.error,
    citation: 'supabase/migrations/20260609000033_s1_phase5_deposits_withdrawals.sql:403-459',
  };
  allProbes.push(solvProbe);
  if (!solvProbe.passed) failures.push(`3d solvency: ${solvWd.error}`);

  const betWhileSolv = await placeDiceBet(config, fixture, 'd3d-bet');
  if (!betWhileSolv.ok) failures.push('3d bet blocked (over-block)');

  clearSolvencyHold();
  ensureLivePlatform();

  return {
    verdict: failures.length === 0 ? 'pass' : 'fail',
    summary:
      failures.length === 0
        ? '부분 게이트: 출금/parity/mines/솔벤시 범위 정확'
        : failures.join('; '),
    measurements: {
      wd_gate_blocked: wdProbe.passed,
      parity_hold: parity.ok,
      dice_flag_after_parity: diceFlag ?? 'n/a',
      mines_blocked: minesProbe.passed,
      solvency_blocked: solvProbe.passed,
      failures: failures.length,
    },
    probes: allProbes,
    citations: [
      'supabase/migrations/20260609000019_p0_feature_kill_switches.sql',
      'supabase/migrations/20260609000029_s3_casino_atomic_settlement.sql:735-742',
      'supabase/migrations/20260609000033_s1_phase5_deposits_withdrawals.sql:403',
    ],
  };
}

function runDrill4Permissions(fixture: PentestFixture): {
  verdict: 'pass' | 'fail';
  summary: string;
  measurements: Record<string, string | number | boolean>;
  probes: ProbeResult[];
  citations: string[];
} {
  const probes: ProbeResult[] = [];
  const failures: string[] = [];

  const userHalt = sqlAsUser<unknown>(
    fixture.userA.id,
    `rpc_set_system_mode(true, false, 'gameday unauthorized')`,
  );
  probes.push({
    name: 'user_set_system_mode',
    rpc: 'rpc_set_system_mode',
    actor: 'userA',
    expected: 'reject',
    passed: !userHalt.ok,
    ok: userHalt.ok,
    error: userHalt.error,
    responseSnippet: userHalt.error,
    citation: 'supabase/tests/admin_authz_test.sql',
  });
  if (userHalt.ok) failures.push('user pulled halt');

  const userFeat = sqlAsUser<unknown>(
    fixture.userA.id,
    `rpc_set_feature_enabled('withdrawal', false, 'gameday unauthorized')`,
  );
  probes.push({
    name: 'user_set_feature',
    rpc: 'rpc_set_feature_enabled',
    actor: 'userA',
    expected: 'reject',
    passed: !userFeat.ok,
    ok: userFeat.ok,
    error: userFeat.error,
    responseSnippet: userFeat.error,
    citation: 'supabase/tests/admin_authz_test.sql',
  });
  if (userFeat.ok) failures.push('user pulled feature toggle');

  const aal1Halt = sqlAsAdminAal1<unknown>(
    fixture.adminId,
    `rpc_set_system_mode(false, false, 'gameday aal1 test')`,
  );
  const aal1Blocked =
    !aal1Halt.ok && (aal1Halt.error.includes('ERR_MFA_REQUIRED') || aal1Halt.error.includes('MFA'));
  probes.push({
    name: 'aal1_set_system_mode',
    rpc: 'rpc_set_system_mode',
    actor: 'admin_aal1',
    expected: 'reject',
    passed: aal1Blocked,
    ok: aal1Halt.ok,
    error: aal1Halt.error,
    responseSnippet: aal1Halt.error,
    citation: 'supabase/tests/admin_mfa_aal2_test.sql:26-33',
  });
  if (!aal1Blocked) failures.push(`aal1 not blocked: ${aal1Halt.error}`);

  const aal1Feat = sqlAsAdminAal1<unknown>(
    fixture.adminId,
    `rpc_set_feature_enabled('withdrawal', true, 'gameday aal1 test')`,
  );
  const aal1FeatBlocked =
    !aal1Feat.ok && (aal1Feat.error.includes('ERR_MFA_REQUIRED') || aal1Feat.error.includes('MFA'));
  probes.push({
    name: 'aal1_set_feature',
    rpc: 'rpc_set_feature_enabled',
    actor: 'admin_aal1',
    expected: 'reject',
    passed: aal1FeatBlocked,
    ok: aal1Feat.ok,
    error: aal1Feat.error,
    responseSnippet: aal1Feat.error,
    citation: 'supabase/tests/admin_mfa_aal2_test.sql',
  });
  if (!aal1FeatBlocked) failures.push(`aal1 feature not blocked`);

  const aal2Ok = setSystemMode(fixture.adminId, false, false, 'gameday aal2 allow check');
  probes.push({
    name: 'aal2_set_system_mode',
    rpc: 'rpc_set_system_mode',
    actor: 'admin_aal2',
    expected: 'allow',
    passed: aal2Ok.ok,
    ok: aal2Ok.ok,
    error: aal2Ok.error,
    responseSnippet: aal2Ok.error || 'ok',
    citation: 'supabase/tests/admin_mfa_aal2_test.sql:68',
  });
  if (!aal2Ok.ok) failures.push('aal2 admin blocked');

  return {
    verdict: failures.length === 0 ? 'pass' : 'fail',
    summary:
      failures.length === 0
        ? '비상 레버: user/AAL1 거부, AAL2 허용'
        : failures.join('; '),
    measurements: {
      user_halt_blocked: probes[0]?.passed ?? false,
      user_feature_blocked: probes[1]?.passed ?? false,
      aal1_blocked: aal1Blocked,
      aal2_allowed: aal2Ok.ok,
    },
    probes,
    citations: [
      'supabase/tests/admin_authz_test.sql',
      'supabase/tests/admin_mfa_aal2_test.sql',
      'supabase/migrations/20260613000084_admin_mfa_aal2_guard.sql',
    ],
  };
}

async function runDrill5Restore(
  config: PentestConfig,
  fixture: PentestFixture,
): Promise<{
  verdict: 'pass' | 'fail';
  summary: string;
  measurements: Record<string, string | number | boolean>;
  probes: ProbeResult[];
  citations: string[];
  restoreCommands: string[];
}> {
  ensureLivePlatform();
  const snapshotBefore = capturePreRestoreSnapshot(fixture.userA.id);

  let dumpPath: string;
  let dumpCommands: string[];
  try {
    const dump = createLocalDump('gameday-restore');
    dumpPath = dump.dumpPath;
    dumpCommands = dump.commands;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      verdict: 'fail',
      summary: `pg_dump failed: ${msg}`,
      measurements: snapshotMeasurements(snapshotBefore),
      probes: [],
      citations: ['scripts/backup-rehearsal.ts'],
      restoreCommands: [],
    };
  }

  await placeDiceBet(config, fixture, 'd5-mutate-1');
  await placeDiceBet(config, fixture, 'd5-mutate-2');
  const snapshotMutated = captureSnapshot(fixture.userA.id);
  const mutated =
    snapshotMutated.gameBetsCount !== snapshotBefore.gameBetsCount ||
    snapshotMutated.wallet?.phon_available !== snapshotBefore.wallet?.phon_available;

  const restore = restoreFromDump(dumpPath);
  const outcome = evaluateRestoreDrill(
    snapshotBefore,
    captureSnapshot(fixture.userA.id),
    dumpPath,
    restore,
    dumpCommands,
  );

  return {
    verdict: outcome.pass ? 'pass' : 'fail',
    summary: outcome.pass
      ? `복원 OK — hash-chain 0, snapshot 일치 (mutated=${mutated})`
      : (outcome.error ?? 'restore mismatch'),
    measurements: {
      ...snapshotMeasurements(snapshotBefore),
      mutated_detected: mutated,
      hash_wallet_broken: outcome.hashChainWalletBroken,
      hash_system_broken: outcome.hashChainSystemBroken,
      snapshot_diffs: outcome.diffs.length,
      dump_bytes: dumpPath,
    },
    probes: [],
    citations: ['scripts/backup-rehearsal.ts', 'scripts/game-day/lib/restore-drill.ts'],
    restoreCommands: outcome.commands,
  };
}

function runDrill6Integrity(
  sigmaBefore: { PHON: string; USDT: string; KRW: string } | null,
): {
  verdict: 'pass' | 'fail';
  summary: string;
  measurements: Record<string, string | number | boolean>;
  citations: string[];
} {
  const inv = runInvariantChecks();
  const recon = runReconciliation();
  const sigma = getCurrencyTotals();
  const drift = getPerWalletDrift();
  const neg = hasNegativeBalances();

  const invHealthy =
    inv?.['healthy'] === true ||
    (inv?.['ok'] === true && inv?.['mismatch'] === false);
  const reconMatch =
    recon?.['is_match'] === true ||
    (recon?.['ok'] === true && recon?.['mismatch'] === false);
  const sigmaOk = sigmaBefore
    ? sigma?.PHON === sigmaBefore.PHON &&
      sigma?.USDT === sigmaBefore.USDT &&
      sigma?.KRW === sigmaBefore.KRW
    : true;

  const pass = invHealthy && reconMatch && drift.length === 0 && !neg.found && sigmaOk;

  return {
    verdict: pass ? 'pass' : 'fail',
    summary: pass
      ? 'Σ=0 · drift=0 · invariant/reconciliation healthy'
      : `inv=${invHealthy} recon=${reconMatch} drift=${drift.length} neg=${neg.found}`,
    measurements: {
      invariant_healthy: invHealthy,
      reconciliation_match: reconMatch,
      drift_rows: drift.length,
      negative_balances: neg.found,
      sigma_phon: sigma?.PHON ?? 'n/a',
      sigma_usdt: sigma?.USDT ?? 'n/a',
      sigma_krw: sigma?.KRW ?? 'n/a',
    },
    citations: [
      'supabase/migrations/20260613000087_invariant_checks_monitoring.sql',
      'supabase/migrations/20260609000026_s1_solvency_reconciliation.sql',
    ],
  };
}

async function main(): Promise<void> {
  const config = loadPentestConfig();
  const admin = adminClient(config);
  const builder = createGamedayReportBuilder(config.url);

  builder.setInventory(EMERGENCY_LEVER_INVENTORY);
  builder.setRunbook(defaultRunbook());
  builder.setMechanisms([
    '_assert_system_live() injected first in user balance-moving RPCs (20260609000018)',
    '_assert_admin_aal2() on admin rpc_* entry (20260613000084)',
    'Liquidation paths deliberately unguarded by halt (solvency de-risk)',
    'rpc_process_bank_transfer / rpc_approve_withdrawal: verify halt coverage in drill 1',
    'Per-game kill: app_config.feature_game_{game}_enabled — no rpc_set_feature_enabled whitelist entry',
  ]);

  let fixture: PentestFixture;
  try {
    console.log('[gameday] Creating fixture (deposit-funded user A)...');
    fixture = await createPentestFixture(admin, config);
    console.log(`[gameday] User A PHON: ${fixture.userA.phonAfterDeposit}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[gameday] FATAL fixture: ${msg}`);
    builder.addDrill({
      id: 'drill-fixture',
      title: 'Fixture bootstrap',
      verdict: 'fail',
      summary: msg,
      measurements: {},
      citations: [],
    });
    const report = builder.finalize();
    printGamedayReport(report);
    writeGamedayReport(report);
    process.exit(1);
  }

  console.log('[gameday] Drill 1 — full halt...');
  const d1 = await runDrill1Halt(config, fixture);
  builder.addDrill({
    id: 'drill-1',
    title: '드릴 1 — 전체 킬스위치 (halt)',
    ...d1,
  });

  console.log('[gameday] Drill 2 — readonly...');
  const d2 = await runDrill2Readonly(config, fixture);
  builder.addDrill({
    id: 'drill-2',
    title: '드릴 2 — 읽기전용 모드',
    ...d2,
  });

  console.log('[gameday] Drill 3 — partial gates...');
  const d3 = await runDrill3Partial(config, fixture);
  builder.addDrill({
    id: 'drill-3',
    title: '드릴 3 — 부분 게이트',
    ...d3,
  });

  console.log('[gameday] Drill 4 — permissions...');
  const d4 = runDrill4Permissions(fixture);
  builder.addDrill({
    id: 'drill-4',
    title: '드릴 4 — 권한',
    ...d4,
  });

  console.log('[gameday] Drill 5 — backup restore...');
  const d5 = await runDrill5Restore(config, fixture);
  builder.addDrill({
    id: 'drill-5',
    title: '드릴 5 — 백업 복원',
    verdict: d5.verdict,
    summary: d5.summary,
    measurements: d5.measurements,
    probes: d5.probes,
    citations: d5.citations,
  });
  builder.setRestoreCommands(d5.restoreCommands);

  let sigmaBaseline: { PHON: string; USDT: string; KRW: string } | null = fixture.sigmaBefore;

  if (d5.verdict === 'fail') {
    resetLocalDbAfterFailedRestore();
    sigmaBaseline = null;
  } else {
    try {
      ensureLivePlatform();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`[gameday] post-restore ensureLivePlatform: ${msg}`);
    }
  }

  console.log('[gameday] Drill 6 — final integrity...');
  try {
    ensureLivePlatform();
    clearSolvencyHold();
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[gameday] drill 6 preflight: ${msg}`);
  }
  const d6 = runDrill6Integrity(sigmaBaseline);
  builder.addDrill({
    id: 'drill-6',
    title: '드릴 6 — Σ=0 / 무결성 최종',
    probes: [],
    ...d6,
  });

  const report = builder.finalize();
  const path = writeGamedayReport(report);
  printGamedayReport(report);
  console.log(`[gameday] Report: ${path}`);

  process.exit(report.sectionA.launchBlockers.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('[gameday] unhandled:', error);
  process.exit(1);
});
