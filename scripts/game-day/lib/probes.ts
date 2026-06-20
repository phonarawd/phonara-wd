import type { SupabaseClient } from '@supabase/supabase-js';
import type { PentestConfig } from '../../pentest/lib/config.ts';
import { userClient } from '../../pentest/lib/config.ts';
import {
  createGameRound,
  fundViaKrwDeposit,
  seedOracleAndMarkets,
} from '../../pentest/lib/deposit-path.ts';
import type { PentestFixture } from '../../pentest/lib/fixture.ts';
import {
  createKnownSeedRound,
  getGameCase,
  openRound,
  placeBet,
  uniqueIdem,
} from '../../pentest/lib/game-fixture.ts';
import { getWalletSnapshot } from '../../pentest/lib/verify.ts';
import { sqlAsAdmin, sqlAsService, sqlExec } from './sql-claims.ts';

function sqlLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

export type ProbeExpect = 'reject' | 'allow';

const HALT_BLOCK_PATTERNS = ['system_halted', 'system_readonly', 'feature_disabled', 'withdrawal_solvency_hold'];

export function evaluateProbe(expected: ProbeExpect, ok: boolean, error: string): boolean {
  if (expected === 'allow') return ok;
  if (ok) return false;
  const lower = error.toLowerCase();
  return HALT_BLOCK_PATTERNS.some((p) => lower.includes(p));
}

export interface ProbeResult {
  readonly name: string;
  readonly rpc: string;
  readonly actor: string;
  readonly expected: ProbeExpect;
  readonly passed: boolean;
  readonly ok: boolean;
  readonly error: string;
  readonly responseSnippet: string;
  readonly citation?: string;
}

export async function tryUserRpc(
  config: PentestConfig,
  token: string,
  rpc: string,
  args: Record<string, unknown>,
): Promise<{ ok: boolean; error: string; data: unknown }> {
  const { data, error } = await userClient(config, token).rpc(rpc as never, args as never);
  if (error) return { ok: false, error: error.message, data: null };
  if (data === null || data === undefined) return { ok: false, error: 'null response', data: null };
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (obj['ok'] === false) {
      return { ok: false, error: String(obj['reason'] ?? obj['error'] ?? 'ok=false'), data };
    }
    if (
      obj['withdrawal_id'] ||
      obj['bet_id'] ||
      obj['position_id'] ||
      obj['trade_id'] ||
      obj['deposit_id'] ||
      obj['reference_code']
    ) {
      return { ok: true, error: '', data };
    }
    if (obj['status'] === 'won' || obj['status'] === 'lost' || obj['status'] === 'parity_hold') {
      return { ok: true, error: '', data };
    }
  }
  return { ok: true, error: '', data };
}

function snippet(value: unknown, max = 200): string {
  const raw = typeof value === 'string' ? value : JSON.stringify(value);
  return raw.length <= max ? raw : `${raw.slice(0, max)}…`;
}

export async function placeDiceBet(
  config: PentestConfig,
  fixture: PentestFixture,
  tag: string,
): Promise<{ ok: boolean; betId?: string; error: string }> {
  seedOracleAndMarkets();
  sqlExec(`UPDATE app_config SET value = 'true' WHERE key IN ('feature_game_enabled', 'feature_game_dice_enabled');`);
  const opened = await openRound(config, fixture.userA.accessToken, 'dice');
  if (!opened.ok || !opened.data) {
    return { ok: false, error: opened.error || 'open round failed' };
  }
  const gameCase = getGameCase('dice');
  const bet = await placeBet(config, fixture.userA.accessToken, {
    roundId: opened.data.round_id,
    stake: gameCase.stake,
    selection: gameCase.selection,
    clientSeed: `gameday-${tag}`,
    idempotencyKey: uniqueIdem(`gameday-dice-${tag}`),
  });
  if (!bet.ok || !bet.data) return { ok: false, error: bet.error || 'bet failed' };
  if (bet.data.status !== 'won' && bet.data.status !== 'lost') {
    return { ok: false, error: `unexpected status ${bet.data.status}` };
  }
  return { ok: true, betId: bet.data.bet_id, error: '' };
}

export async function requestSmallWithdrawal(
  config: PentestConfig,
  fixture: PentestFixture,
  tag: string,
  amount = '50.000000',
): Promise<{ ok: boolean; withdrawalId?: string; error: string }> {
  const res = await tryUserRpc(config, fixture.userA.accessToken, 'rpc_request_withdrawal', {
    p_currency: 'PHON',
    p_amount: amount,
    p_destination: { type: 'bank', account: 'gameday-test' },
    p_idempotency_key: uniqueIdem(`gameday-wd-${tag}`),
  });
  if (!res.ok) return { ok: false, error: res.error };
  const wdId = (res.data as Record<string, unknown> | null)?.['withdrawal_id'];
  return { ok: true, withdrawalId: wdId ? String(wdId) : undefined, error: '' };
}

export async function rejectPendingWithdrawals(
  adminId: string,
  userId: string,
): Promise<void> {
  const rows = sqlExec(`
    SELECT id::text FROM withdrawal_requests
    WHERE user_id = ${sqlLiteral(userId)}::uuid AND status = 'pending';
  `);
  if (!rows.ok) return;
  for (const id of rows.stdout.trim().split('\n').filter(Boolean)) {
    sqlAsAdmin(adminId, `rpc_reject_withdrawal(${sqlLiteral(id)}::uuid, 'gameday cleanup')`);
  }
}

export async function runMoneyProbeMatrix(
  config: PentestConfig,
  fixture: PentestFixture,
  expected: ProbeExpect,
  pendingWithdrawalId?: string,
): Promise<ProbeResult[]> {
  const results: ProbeResult[] = [];
  const { userA, adminId } = fixture;
  const tag = Date.now().toString(36);

  const add = (
    name: string,
    rpc: string,
    actor: string,
    ok: boolean,
    error: string,
    data: unknown,
    citation?: string,
  ) => {
    results.push({
      name,
      rpc,
      actor,
      expected,
      passed: evaluateProbe(expected, ok, error),
      ok,
      error,
      responseSnippet: snippet(data ?? error),
      citation,
    });
  };

  // Game bet
  seedOracleAndMarkets();
  const roundId = createGameRound();
  const betRes = await tryUserRpc(config, userA.accessToken, 'rpc_place_game_bet', {
    p_round_id: roundId,
    p_currency: 'PHON',
    p_stake: '10.000000',
    p_selection: { target: '50.00', direction: 'over' },
    p_client_seed: `gameday-probe-${tag}`,
    p_idempotency_key: uniqueIdem(`gameday-probe-bet-${tag}`),
  });
  add(
    'game_bet',
    'rpc_place_game_bet',
    'userA',
    betRes.ok,
    betRes.error,
    betRes.data,
    'supabase/migrations/20260609000029_s3_casino_atomic_settlement.sql',
  );

  // Withdrawal request
  const wdRes = await tryUserRpc(config, userA.accessToken, 'rpc_request_withdrawal', {
    p_currency: 'PHON',
    p_amount: '25.000000',
    p_destination: { type: 'bank' },
    p_idempotency_key: uniqueIdem(`gameday-probe-wd-${tag}`),
  });
  add(
    'withdrawal_request',
    'rpc_request_withdrawal',
    'userA',
    wdRes.ok,
    wdRes.error,
    wdRes.data,
    'supabase/migrations/20260609000035_s1_withdrawal_lock_lifecycle.sql:144',
  );

  // Withdrawal approve
  if (pendingWithdrawalId) {
    const appr = sqlAsAdmin<Record<string, unknown>>(
      adminId,
      `rpc_approve_withdrawal(${sqlLiteral(pendingWithdrawalId)}::uuid, 'gameday probe approve')`,
    );
    add(
      'withdrawal_approve',
      'rpc_approve_withdrawal',
      'admin_aal2',
      appr.ok,
      appr.error,
      appr.data,
      'supabase/migrations/20260611000063_withdrawal_admin_guard_and_deposit_lock.sql:24',
    );
  }

  // Deposit request (user)
  const depReq = await tryUserRpc(config, userA.accessToken, 'rpc_create_krw_deposit_request', {
    p_amount_krw: '10000',
    p_client_request_id: uniqueIdem('gameday-dep-req'),
  });
  add(
    'deposit_request',
    'rpc_create_krw_deposit_request',
    'userA',
    depReq.ok,
    depReq.error,
    depReq.data,
    'supabase/migrations/20260609000033_s1_phase5_deposits_withdrawals.sql:767',
  );

  // Bank transfer (service_role) — create matching deposit if request succeeded
  let bankOk = false;
  let bankErr = '';
  let bankData: unknown = null;
  if (depReq.ok && depReq.data) {
    const ref = String((depReq.data as Record<string, unknown>)['reference_code'] ?? '');
    const transferId = `GAMEDAY-TXN-${tag}`;
    const bank = sqlAsService<Record<string, unknown>>(
      `rpc_process_bank_transfer(
        ${sqlLiteral(transferId)},
        '10000',
        ${sqlLiteral(userA.depositorName)},
        ${sqlLiteral(ref)}
      )`,
    );
    bankOk = bank.ok && Boolean(bank.data?.['ok']);
    bankErr = bank.error || (bankOk ? '' : JSON.stringify(bank.data));
    bankData = bank.data;
  } else {
    bankErr = depReq.error || 'skipped — deposit request blocked';
  }
  const bankBlockedCascade =
    expected === 'reject' &&
    !depReq.ok &&
    HALT_BLOCK_PATTERNS.some((p) => depReq.error.toLowerCase().includes(p));
  results.push({
    name: 'bank_transfer',
    rpc: 'rpc_process_bank_transfer',
    actor: 'service_role',
    expected,
    passed: bankBlockedCascade || evaluateProbe(expected, bankOk, bankErr),
    ok: bankOk,
    error: bankErr,
    responseSnippet: snippet(bankData ?? bankErr),
    citation: 'supabase/migrations/20260609000033_s1_phase5_deposits_withdrawals.sql:737',
  });

  // Futures open
  const futRes = await tryUserRpc(config, userA.accessToken, 'rpc_open_futures_position', {
    p_market: 'PHONUSDT-PERP',
    p_side: 'long',
    p_margin_currency: 'USDT',
    p_margin_amount: '10.000000',
    p_leverage: '2',
    p_client_request_id: uniqueIdem(`gameday-fut-${tag}`),
  });
  add(
    'futures_open',
    'rpc_open_futures_position',
    'userA',
    futRes.ok,
    futRes.error,
    futRes.data,
    'supabase/migrations/20260609000007_phase3_trading_rpcs.sql',
  );

  // Spot buy
  const spotRes = await tryUserRpc(config, userA.accessToken, 'rpc_spot_market_buy', {
    p_usdt_spent: '5.000000',
    p_client_request_id: uniqueIdem(`gameday-spot-${tag}`),
  });
  add(
    'spot_buy',
    'rpc_spot_market_buy',
    'userA',
    spotRes.ok,
    spotRes.error,
    spotRes.data,
    'supabase/migrations/20260609000007_phase3_trading_rpcs.sql',
  );

  return results;
}

export function probeWalletRead(userId: string): ProbeResult {
  const wallet = getWalletSnapshot(userId);
  const ok = wallet !== null;
  return {
    name: 'wallet_read',
    rpc: 'wallets SELECT',
    actor: 'sql',
    expected: 'allow',
    passed: ok,
    ok,
    error: ok ? '' : 'wallet read failed',
    responseSnippet: ok ? JSON.stringify(wallet) : 'null',
    citation: 'apps/web — read path (no _assert_system_live on SELECT)',
  };
}

export async function triggerParityHold(
  config: PentestConfig,
  fixture: PentestFixture,
): Promise<{ ok: boolean; betId?: string; error: string }> {
  const badSeed = 'gameday_parity_hold_seed_00112233445566778899aabbccddeeff';
  const badRound = await createKnownSeedRound(config, 'dice', badSeed);
  if (!badRound.ok || !badRound.data) {
    return { ok: false, error: badRound.error || 'round create failed' };
  }
  const bet = await placeBet(config, fixture.userA.accessToken, {
    roundId: badRound.data.round_id,
    stake: '10.000000',
    selection: { target: '50.00', direction: 'over' },
    clientSeed: 'gameday-parity',
    idempotencyKey: uniqueIdem('gameday-parity'),
    expectedResult: { roll: 99.99, won: true },
  });
  if (!bet.ok || !bet.data) return { ok: false, error: bet.error || 'bet failed' };
  if (bet.data.status !== 'parity_hold') {
    return { ok: false, error: `expected parity_hold, got ${bet.data.status}` };
  }
  return { ok: true, betId: bet.data.bet_id, error: '' };
}

export function readParityHoldFlag(game: string): string | null {
  const result = sqlExec(
    `SELECT value FROM app_config WHERE key = 'feature_game_${game}_enabled';`,
  );
  return result.ok ? result.stdout.trim() || null : null;
}

export async function tryDepositPathForProbe(
  config: PentestConfig,
  admin: SupabaseClient,
  fixture: PentestFixture,
  tag: string,
): Promise<ProbeResult> {
  const { createClient } = await import('@supabase/supabase-js');
  const userClientInst = createClient(config.url, config.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${fixture.userA.accessToken}` } },
  });
  try {
    await fundViaKrwDeposit(
      userClientInst,
      admin,
      fixture.userA.id,
      '5000',
      uniqueIdem(`gameday-dep-${tag}`),
      fixture.userA.depositorName,
    );
    return {
      name: 'krw_deposit_path',
      rpc: 'rpc_create_krw_deposit_request + rpc_process_bank_transfer',
      actor: 'user+service',
      expected: 'allow',
      passed: true,
      ok: true,
      error: '',
      responseSnippet: 'deposit matched',
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      name: 'krw_deposit_path',
      rpc: 'rpc_create_krw_deposit_request + rpc_process_bank_transfer',
      actor: 'user+service',
      expected: 'allow',
      passed: false,
      ok: false,
      error: msg,
      responseSnippet: msg,
    };
  }
}
