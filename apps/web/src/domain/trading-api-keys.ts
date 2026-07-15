/**
 * Trading API key RPC wrappers — E8 engine · E10 UI (`ew-e10-wallet-settings-ui`).
 */
import { callRpc } from '../lib/rpc';

export type TradingApiKeyScope = 'read' | 'trade';

export interface TradingApiKeyRow {
  id: string;
  name: string;
  key_prefix: string;
  key_masked: string;
  scopes: TradingApiKeyScope[];
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export interface CreateTradingApiKeyResult {
  ok: boolean;
  id: string;
  name: string;
  key_prefix: string;
  api_key: string;
  scopes: TradingApiKeyScope[];
  secret_shown_once: boolean;
}

export async function listTradingApiKeys(): Promise<TradingApiKeyRow[]> {
  const data = await callRpc('rpc_list_trading_api_keys');
  const payload = data as unknown as { ok?: boolean; keys?: TradingApiKeyRow[] };
  return payload.keys ?? [];
}

export async function createTradingApiKey(
  name: string,
  scopes: TradingApiKeyScope[] = ['read'],
): Promise<CreateTradingApiKeyResult> {
  const data = await callRpc('rpc_create_trading_api_key', {
    p_name: name,
    p_scopes: scopes,
  });
  return data as unknown as CreateTradingApiKeyResult;
}

export async function revokeTradingApiKey(keyId: string): Promise<{ ok: boolean; id: string }> {
  const data = await callRpc('rpc_revoke_trading_api_key', { p_key_id: keyId });
  return data as unknown as { ok: boolean; id: string };
}
