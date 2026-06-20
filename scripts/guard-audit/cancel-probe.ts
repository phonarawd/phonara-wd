#!/usr/bin/env tsx
import { adminClient, loadPentestConfig } from '../pentest/lib/config.ts';
import { createPentestFixture } from '../pentest/lib/fixture.ts';
import { sqlAsUser, sqlExec } from '../pentest/lib/sql-rpc.ts';

const config = loadPentestConfig();
const admin = adminClient(config);
const fixture = await createPentestFixture(admin, config);
const uid = fixture.userA.id;

sqlExec(`
  UPDATE app_config SET value='false' WHERE key IN ('system_halt','system_readonly');
  UPDATE app_config SET value='true' WHERE key IN ('feature_game_enabled','feature_game_mines_enabled');
`);

const round = sqlAsUser<{ round_id?: string }>(uid, `rpc_open_game_round('mines')`);
console.log('round', round.ok, round.error?.slice(0, 120));
if (round.ok && round.data?.round_id) {
  const bet = sqlAsUser<{ bet_id?: string; status?: string }>(
    uid,
    `rpc_place_game_bet('${round.data.round_id}'::uuid, 'PHON', '5.000000', '{"mines":3,"picks":[]}'::jsonb, 'seed', 'guard-cancel-probe')`,
  );
  console.log('bet', bet.ok, bet.data, bet.error?.slice(0, 120));
  if (bet.ok && bet.data?.bet_id && bet.data.status === 'pending') {
    sqlExec(`UPDATE app_config SET value='true' WHERE key='system_halt'`);
    const cancel = sqlAsUser(uid, `rpc_cancel_game_bet('${bet.data.bet_id}'::uuid)`);
    sqlExec(`UPDATE app_config SET value='false' WHERE key='system_halt'`);
    console.log('cancel_halt', { ok: cancel.ok, err: cancel.error?.slice(0, 200), LEAKED: cancel.ok });
  } else {
    console.log('bet_not_pending', bet.data);
  }
}

sqlExec(`UPDATE app_config SET value='false' WHERE key='system_halt'`);
