#!/usr/bin/env tsx
import { sqlAsAdminAal1, sqlAsUser, sqlExec } from '../pentest/lib/sql-rpc.ts';

const adminId = sqlExec(`SELECT id::text FROM profiles WHERE role='admin' LIMIT 1`).stdout.trim();
sqlExec(`UPDATE app_config SET value='false' WHERE key IN ('system_halt','system_readonly')`);

const crypto2 = sqlAsAdminAal1(
  adminId,
  `rpc_admin_match_crypto_deposit('0xaudit4', 'ERC20', '0xaddr', '1.000000', 12)`,
);
console.log('crypto_aal1_payload', JSON.stringify(crypto2.data));

const uid = sqlExec(
  `SELECT user_id::text FROM wallets WHERE currency='PHON' AND available::numeric > 100 LIMIT 1`,
).stdout.trim();
console.log('uid', uid || 'NONE');
if (uid) {
  sqlExec(`UPDATE app_config SET value='true' WHERE key='system_halt'`);
  const spot = sqlAsUser(uid, `rpc_spot_market_buy('100.000000', 'guard-audit-legacy-spot')`);
  sqlExec(`UPDATE app_config SET value='false' WHERE key='system_halt'`);
  console.log('legacy_spot_halt', {
    ok: spot.ok,
    err: (spot.error || '').slice(0, 250),
    leaked: spot.ok,
  });
}

// pending mines bet cancel during halt
const round = sqlAsUser(uid, `rpc_open_game_round('mines')`);
if (round.ok && round.data && typeof round.data === 'object' && 'round_id' in round.data) {
  const rid = (round.data as { round_id: string }).round_id;
  const bet = sqlAsUser(
    uid,
    `rpc_place_game_bet('${rid}'::uuid, 'PHON', '5.000000', '{"mines":3,"reveals":[]}'::jsonb, 'seed', 'guard-audit-mines-cancel')`,
  );
  if (bet.ok && bet.data && typeof bet.data === 'object' && 'bet_id' in bet.data) {
    const bid = (bet.data as { bet_id: string }).bet_id;
    sqlExec(`UPDATE app_config SET value='true' WHERE key='system_halt'`);
    const cancel = sqlAsUser(uid, `rpc_cancel_game_bet('${bid}'::uuid)`);
    sqlExec(`UPDATE app_config SET value='false' WHERE key='system_halt'`);
    console.log('cancel_game_halt', {
      ok: cancel.ok,
      err: (cancel.error || '').slice(0, 250),
      leaked: cancel.ok,
    });
  } else {
    console.log('mines_bet_setup', { ok: bet.ok, err: (bet.error || '').slice(0, 200) });
  }
}

// limit order halt via helper
if (uid) {
  sqlExec(`UPDATE app_config SET value='true' WHERE key='system_halt'`);
  const lim = sqlAsUser(
    uid,
    `rpc_place_limit_order('BTCUSDT','long','USDT','10.000000','5','50000.000000','guard-audit-limit')`,
  );
  sqlExec(`UPDATE app_config SET value='false' WHERE key='system_halt'`);
  console.log('limit_order_halt', {
    ok: lim.ok,
    err: (lim.error || '').slice(0, 250),
    blocked: (lim.error || '').includes('system_halted'),
  });
}
