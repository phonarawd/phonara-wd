#!/usr/bin/env tsx
/** One-off: halt ON → approve blocked (system_halted), reject ok. */
import { adminClient, loadPentestConfig } from '../pentest/lib/config.ts';
import { createPentestFixture } from '../pentest/lib/fixture.ts';
import { sqlAsAdmin, sqlAsUser, sqlExec } from '../pentest/lib/sql-rpc.ts';

const config = loadPentestConfig();
const admin = adminClient(config);
const fixture = await createPentestFixture(admin, config);
const { adminId } = fixture;
const userId = fixture.userA.id;

sqlExec(`
  UPDATE app_config SET value = 'false' WHERE key IN ('system_halt', 'system_readonly');
  UPDATE app_config SET value = 'true' WHERE key = 'feature_withdrawal_enabled';
`);

const reqApprove = sqlAsUser<{ withdrawal_id?: string }>(
  userId,
  "rpc_request_withdrawal('PHON', '10.000000', '{}'::jsonb, 'spotcheck-wd-approve', NULL)",
);
const reqReject = sqlAsUser<{ withdrawal_id?: string }>(
  userId,
  "rpc_request_withdrawal('PHON', '11.000000', '{}'::jsonb, 'spotcheck-wd-reject', NULL)",
);
if (!reqApprove.ok || !reqApprove.data?.withdrawal_id || !reqReject.ok || !reqReject.data?.withdrawal_id) {
  console.error('FAIL setup:', reqApprove.error, reqReject.error);
  process.exit(1);
}

const wdApprove = reqApprove.data.withdrawal_id;
const wdReject = reqReject.data.withdrawal_id;

sqlExec(`UPDATE app_config SET value = 'true' WHERE key = 'system_halt';`);

const approve = sqlAsAdmin(adminId, `rpc_approve_withdrawal('${wdApprove}'::uuid, 'halt spot-check approve')`);
const reject = sqlAsAdmin<{ ok?: boolean; status?: string }>(
  adminId,
  `rpc_reject_withdrawal('${wdReject}'::uuid, 'halt spot-check reject')`,
);

console.log('=== halt reject spot-check ===');
console.log('approve wd:', wdApprove);
console.log(
  'approve blocked (system_halted):',
  !approve.ok && approve.error.includes('system_halted'),
  approve.error.slice(0, 200),
);
console.log('reject wd:', wdReject);
console.log('reject ok:', reject.ok, reject.ok ? JSON.stringify(reject.data) : reject.error.slice(0, 200));

sqlExec(`UPDATE app_config SET value = 'false' WHERE key = 'system_halt';`);

const pass =
  !approve.ok &&
  approve.error.includes('system_halted') &&
  reject.ok &&
  reject.data?.status === 'rejected';
if (!pass) process.exit(1);
console.log('SPOT-CHECK PASS');
