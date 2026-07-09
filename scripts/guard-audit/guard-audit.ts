#!/usr/bin/env tsx
/**
 * Guard audit — live pg_get_functiondef + AAL1/halt probes. Diagnosis only; no schema changes.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  BALANCE_CALLEE_HELPERS,
  balanceMovingSqlPattern,
  buildDetectionContext,
  isAllowlisted,
  isBalanceMoving,
  isGuardedByCalleeOrSelf,
  type RpcDefRow,
} from '../check/guard-coverage-allowlist.ts';
import { adminClient, loadPentestConfig } from '../pentest/lib/config.ts';
import { createPentestFixture } from '../pentest/lib/fixture.ts';
import { seedOracleAndMarkets } from '../pentest/lib/deposit-path.ts';
import { sqlAsAdminAal1, sqlAsService, sqlAsUser, sqlExec } from '../pentest/lib/sql-rpc.ts';
import {
  fundUsdtForSpotProbe,
  seedMinesCancelProbe,
  seedSportsCashoutProbe,
} from './lib/sports-probe-fixture.ts';

const MIG_DIR = join(process.cwd(), 'supabase', 'migrations');

interface RpcRow {
  name: string;
  args: string;
  def: string;
  is_admin: boolean;
  aal2: boolean;
  system_live: boolean;
  balance_moving: boolean;
  effectively_guarded: boolean;
}

function loadHelperDefs(): RpcDefRow[] {
  const names = BALANCE_CALLEE_HELPERS.map((n) => `'${n}'`).join(', ');
  const raw = sqlExec(`
    SELECT json_agg(row_to_json(t) ORDER BY t.name, t.args)
    FROM (
      SELECT p.proname AS name,
             pg_get_function_identity_arguments(p.oid) AS args,
             pg_get_functiondef(p.oid) AS def
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname='public' AND p.proname IN (${names})
    ) t;
  `);
  if (!raw.ok) return [];
  return JSON.parse(raw.stdout.trim() || '[]') as RpcDefRow[];
}

function loadLiveMatrix(): RpcRow[] {
  const pattern = balanceMovingSqlPattern();
  const raw = sqlExec(`
    SELECT json_agg(row_to_json(t) ORDER BY t.name, t.args)
    FROM (
      SELECT p.proname AS name,
             pg_get_function_identity_arguments(p.oid) AS args,
             pg_get_functiondef(p.oid) AS def,
             pg_get_functiondef(p.oid) LIKE '%_is_admin()%' AS is_admin,
             pg_get_functiondef(p.oid) LIKE '%_assert_admin_aal2()%' AS aal2,
             pg_get_functiondef(p.oid) LIKE '%_assert_system_live()%' AS system_live,
             pg_get_functiondef(p.oid) ~* '${pattern}' AS balance_moving_sql
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname='public' AND p.proname LIKE 'rpc_%'
    ) t;
  `);
  if (!raw.ok) throw new Error(`matrix query: ${raw.error}`);
  const rows = JSON.parse(raw.stdout.trim() || '[]') as Array<
    RpcRow & { balance_moving_sql: boolean }
  >;
  const helperRows = loadHelperDefs();
  const ctx = buildDetectionContext(rows, helperRows);

  return rows.map((r) => ({
    name: r.name,
    args: r.args,
    def: r.def,
    is_admin: r.is_admin,
    aal2: r.aal2,
    system_live: r.system_live,
    balance_moving: isBalanceMoving(r.def, ctx),
    effectively_guarded: isGuardedByCalleeOrSelf(r.def, r.name, ctx),
  }));
}

function lastDefMigration(rpcName: string): string {
  const files = readdirSync(MIG_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  let last = '';
  for (const f of files) {
    const body = readFileSync(join(MIG_DIR, f), 'utf8');
    if (new RegExp(`CREATE OR REPLACE FUNCTION ${rpcName}\\b`, 'i').test(body)) last = f;
  }
  return last || 'unknown';
}

function trace097Overwrites(): Array<{
  rpc: string;
  guard: 'aal2' | 'system_live';
  injectMig: string;
  wipeMig: string;
  liveHasGuard: boolean;
}> {
  const f097 = '20260615000097_engine100_crypto_rails.sql';
  const body097 = readFileSync(join(MIG_DIR, f097), 'utf8');
  const live = loadLiveMatrix();
  const out: Array<{
    rpc: string;
    guard: 'aal2' | 'system_live';
    injectMig: string;
    wipeMig: string;
    liveHasGuard: boolean;
  }> = [];

  for (const m of body097.matchAll(/CREATE OR REPLACE FUNCTION (rpc_\w+)/g)) {
    const rpc = m[1]!;
    const chunk = body097.slice(m.index!, Math.min(body097.length, m.index! + 12000));
    const row = live.find((r) => r.name === rpc);
    if (!row) continue;

    const hadAdminIn084Scope = chunk.includes('IF NOT _is_admin()');
    if (
      rpc === 'rpc_check_casino_rtp_drift' &&
      hadAdminIn084Scope &&
      !chunk.includes('_assert_admin_aal2')
    ) {
      out.push({
        rpc,
        guard: 'aal2',
        injectMig: '20260613000084_admin_mfa_aal2_guard.sql',
        wipeMig: f097,
        liveHasGuard: row.aal2,
      });
    }
  }
  return out;
}

function probeAal1(
  adminId: string,
  rpcCall: string,
): { ok: boolean; error: string; blocked: boolean } {
  const r = sqlAsAdminAal1<unknown>(adminId, rpcCall);
  const err = r.error || '';
  const blocked = !r.ok && (err.includes('ERR_MFA_REQUIRED') || err.includes('MFA'));
  return { ok: r.ok, error: err.slice(0, 500), blocked };
}

function probeHaltUser(
  userId: string,
  rpcCall: string,
): { ok: boolean; error: string; leaked: boolean } {
  sqlExec(`UPDATE app_config SET value = 'true' WHERE key = 'system_halt';`);
  const r = sqlAsUser<unknown>(userId, rpcCall);
  sqlExec(`UPDATE app_config SET value = 'false' WHERE key = 'system_halt';`);
  const err = r.error || '';
  const haltBlocked = err.includes('system_halted') || err.includes('system_readonly');
  return { ok: r.ok, error: err.slice(0, 500), leaked: r.ok || !haltBlocked };
}

function ensureHaltOff(): void {
  sqlExec(`UPDATE app_config SET value = 'false' WHERE key IN ('system_halt', 'system_readonly');`);
}

function filterActionableAal2Gaps(rows: RpcRow[]): RpcRow[] {
  return rows.filter((r) => r.is_admin && !r.aal2 && !isAllowlisted(r.name, r.args, 'aal2-exempt'));
}

function filterActionableSystemLiveGaps(rows: RpcRow[]): RpcRow[] {
  return rows.filter(
    (r) =>
      r.balance_moving &&
      !r.effectively_guarded &&
      !isAllowlisted(r.name, r.args, 'system-live-exempt'),
  );
}

async function main(): Promise<void> {
  ensureHaltOff();
  const matrix = loadLiveMatrix();
  const config = loadPentestConfig();
  const admin = adminClient(config);
  const fixture = await createPentestFixture(admin, config);
  const adminId = fixture.adminId;
  seedOracleAndMarkets();

  sqlExec(`
    UPDATE app_config SET value = 'true' WHERE key IN (
      'feature_deposit_enabled','feature_withdrawal_enabled','feature_game_enabled',
      'feature_game_dice_enabled','feature_staking_enabled','feature_sports_enabled'
    );
  `);

  const aal1Probes: Record<string, { ok: boolean; error: string; blocked: boolean; call: string }> =
    {};

  aal1Probes.rpc_check_casino_rtp_drift = {
    ...probeAal1(adminId, 'rpc_check_casino_rtp_drift()'),
    call: 'rpc_check_casino_rtp_drift()',
  };

  aal1Probes.rpc_admin_set_sports_risk_tier = {
    ...probeAal1(
      adminId,
      `rpc_admin_set_sports_risk_tier('${fixture.userA.id}'::uuid, 'restricted', 'guard-audit', '0.5', 5000)`,
    ),
    call: 'rpc_admin_set_sports_risk_tier(...)',
  };

  aal1Probes.rpc_void_sports_market = {
    ...probeAal1(adminId, `rpc_void_sports_market(gen_random_uuid(), 'guard-audit')`),
    call: 'rpc_void_sports_market(...)',
  };

  aal1Probes.rpc_admin_list_sports_exposure = {
    ...probeAal1(adminId, 'rpc_admin_list_sports_exposure(NULL)'),
    call: 'rpc_admin_list_sports_exposure(NULL) [read-only control]',
  };

  aal1Probes.rpc_admin_match_crypto_deposit = {
    ...probeAal1(
      adminId,
      `rpc_admin_match_crypto_deposit('0xaudit', 'ethereum', '0xaddr', '1.000000', 12)`,
    ),
    call: 'rpc_admin_match_crypto_deposit(...)',
  };

  aal1Probes.rpc_settle_sports_fixture = {
    ...probeAal1(adminId, `rpc_settle_sports_fixture(gen_random_uuid(), 'home', 'guard-audit')`),
    call: 'rpc_settle_sports_fixture(...)',
  };

  ensureHaltOff();

  const haltProbes: Record<string, { ok: boolean; error: string; leaked: boolean; call: string }> =
    {};

  const stakeRes = sqlAsUser<{ position_id?: string }>(
    fixture.userA.id,
    `rpc_stake_phon('flexible', '100.000000', 'guard-audit-stake')`,
  );

  haltProbes.rpc_stake_phon = {
    ...probeHaltUser(
      fixture.userA.id,
      `rpc_stake_phon('flexible', '50.000000', 'guard-audit-stake-halt')`,
    ),
    call: "rpc_stake_phon('flexible', '50.000000', 'guard-audit-stake-halt') [thin wrapper]",
  };

  const minesBetId = seedMinesCancelProbe(fixture.userA.id);
  if (minesBetId) {
    const cancelCall = `rpc_cancel_game_bet('${minesBetId}'::uuid)`;
    haltProbes.rpc_cancel_game_bet = {
      ...probeHaltUser(fixture.userA.id, cancelCall),
      call: cancelCall,
    };
  }

  const sportsBet = seedSportsCashoutProbe(fixture.userA.id, String(Date.now()));
  if (sportsBet) {
    const cashoutCall = `rpc_cashout_sports_bet('${sportsBet.betId}'::uuid, '${sportsBet.cashoutAmount}', 'guard-audit-cashout-halt')`;
    haltProbes.rpc_cashout_sports_bet = {
      ...probeHaltUser(fixture.userA.id, cashoutCall),
      call: cashoutCall,
    };
  }

  if (stakeRes.ok && stakeRes.data?.position_id) {
    haltProbes.rpc_claim_staking_reward = {
      ...probeHaltUser(
        fixture.userA.id,
        `rpc_claim_staking_reward('${stakeRes.data.position_id}'::uuid)`,
      ),
      call: 'rpc_claim_staking_reward(...)',
    };
    haltProbes.rpc_unstake_phon = {
      ...probeHaltUser(fixture.userA.id, `rpc_unstake_phon('${stakeRes.data.position_id}'::uuid)`),
      call: 'rpc_unstake_phon(...)',
    };
  }

  fundUsdtForSpotProbe(fixture.userA.id);
  sqlExec(`UPDATE app_config SET value = 'true' WHERE key = 'system_halt';`);
  const legacySpot = sqlAsUser<unknown>(
    fixture.userA.id,
    `rpc_spot_market_buy('100.000000', 'guard-audit-legacy-spot')`,
  );
  sqlExec(`UPDATE app_config SET value = 'false' WHERE key = 'system_halt';`);
  haltProbes.rpc_spot_market_buy_legacy = {
    ok: legacySpot.ok,
    error: (legacySpot.error || '').slice(0, 500),
    leaked: legacySpot.ok,
    call: "rpc_spot_market_buy('100.000000', 'guard-audit-legacy-spot') [legacy wrapper]",
  };

  const depReq = sqlAsUser<{ reference_code?: string }>(
    fixture.userA.id,
    `rpc_create_krw_deposit_request('10000', 'guard-audit-bank')`,
  );
  if (depReq.ok && depReq.data?.reference_code) {
    sqlExec(`UPDATE app_config SET value = 'true' WHERE key = 'system_halt';`);
    const bank = sqlAsService<unknown>(
      `rpc_process_bank_transfer('guard-audit-tx', '10000', 'guard-audit-depositor', '${depReq.data.reference_code}')`,
    );
    sqlExec(`UPDATE app_config SET value = 'false' WHERE key = 'system_halt';`);
    haltProbes.rpc_process_bank_transfer = {
      ok: bank.ok,
      error: (bank.error || '').slice(0, 500),
      leaked: bank.ok,
      call: 'rpc_process_bank_transfer(...)',
    };
  }

  ensureHaltOff();

  const overwriteList = trace097Overwrites();
  const launchBlockers: string[] = [];

  const rtp = aal1Probes.rpc_check_casino_rtp_drift;
  if (rtp?.ok) {
    launchBlockers.push(
      '[A] rpc_check_casino_rtp_drift: AAL1 admin 통과 — MFA 없이 RTP drift/게임 kill switch',
    );
  }

  for (const [name, p] of Object.entries(aal1Probes)) {
    if (name === 'rpc_admin_list_sports_exposure') continue;
    if (p.ok) launchBlockers.push(`[B/A] ${name}: AAL1 admin 통과 (상태변경 RPC)`);
  }

  for (const [name, p] of Object.entries(haltProbes)) {
    if (name === 'rpc_process_bank_transfer' || name === 'rpc_spot_market_buy_legacy') continue;
    if (p.leaked) launchBlockers.push(`[B] ${name}: halt ON 중 balance-moving 통과`);
  }

  const actionableAal2Gaps = filterActionableAal2Gaps(matrix);
  const actionableSystemLiveGaps = filterActionableSystemLiveGaps(matrix);

  const report = {
    ranAt: new Date().toISOString(),
    adminId,
    sectionA: {
      launchBlockers,
      headline: launchBlockers.length ? '출시 차단급 ❌ 있음' : '가드 전수 점검 — 차단급 ❌ 없음',
    },
    overwriteList,
    aal1Probes,
    haltProbes,
    aal2Gaps: actionableAal2Gaps.map((r) => ({
      ...r,
      lastMigration: lastDefMigration(r.name),
    })),
    systemLiveGaps: actionableSystemLiveGaps.map((r) => ({
      ...r,
      lastMigration: lastDefMigration(r.name),
    })),
    matrix,
  };

  const outPath = join(process.cwd(), 'scripts', 'guard-audit', 'last-guard-audit-report.json');
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify(
      {
        headline: report.sectionA.headline,
        launchBlockers,
        aal2GapCount: actionableAal2Gaps.length,
        systemLiveGapCount: actionableSystemLiveGaps.length,
        outPath,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  ensureHaltOff();
  console.error(e);
  process.exit(1);
});
