import { sqlAsAdmin, sqlAsService, sqlExec } from './sql-claims.ts';

function sqlLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

export function ensureLivePlatform(): void {
  const result = sqlExec(`
    UPDATE app_config SET value = 'false'
     WHERE key IN ('system_halt', 'system_readonly');
    UPDATE app_config SET value = 'true'
     WHERE key IN (
       'feature_deposit_enabled', 'feature_withdrawal_enabled',
       'feature_game_enabled', 'feature_game_dice_enabled',
       'feature_game_mines_enabled', 'feature_futures_enabled',
       'feature_spot_enabled'
     );
  `);
  if (!result.ok) {
    if (result.error.includes('recovery mode')) {
      throw new Error(`ensureLivePlatform failed (DB recovery): ${result.error}`);
    }
    throw new Error(`ensureLivePlatform failed: ${result.error}`);
  }
  sqlAsService(`rpc_run_reconciliation()`);
}

export function setSystemMode(
  adminId: string,
  halt: boolean,
  readonly: boolean,
  reason: string,
): { ok: boolean; error: string } {
  const result = sqlAsAdmin<Record<string, unknown>>(
    adminId,
    `rpc_set_system_mode(${halt}, ${readonly}, ${sqlLiteral(reason)})`,
  );
  return { ok: result.ok, error: result.error };
}

export function setFeatureEnabled(
  adminId: string,
  feature: string,
  enabled: boolean,
  reason: string,
): { ok: boolean; error: string } {
  const result = sqlAsAdmin<Record<string, unknown>>(
    adminId,
    `rpc_set_feature_enabled(${sqlLiteral(feature)}, ${enabled}, ${sqlLiteral(reason)})`,
  );
  return { ok: result.ok, error: result.error };
}

export function setPerGameEnabled(game: string, enabled: boolean): void {
  const key = `feature_game_${game}_enabled`;
  const result = sqlExec(`
    UPDATE app_config SET value = ${enabled ? "'true'" : "'false'"}, updated_at = NOW()
     WHERE key = ${sqlLiteral(key)};
  `);
  if (!result.ok) throw new Error(`setPerGameEnabled(${game}) failed: ${result.error}`);
}

export function readAppConfig(key: string): string | null {
  const result = sqlExec(`SELECT value FROM app_config WHERE key = ${sqlLiteral(key)};`);
  if (!result.ok) return null;
  return result.stdout.trim() || null;
}

export function triggerSolvencyHold(): void {
  sqlExec(`DELETE FROM reconciliation_log;`);
}

export function clearSolvencyHold(): void {
  sqlExec(`
    UPDATE treasury_reserves SET real_balance = '99999999.000000', buffer_pct = 10
     WHERE currency IN ('PHON', 'USDT', 'KRW');
  `);
  sqlAsService(`rpc_run_reconciliation()`);
}
