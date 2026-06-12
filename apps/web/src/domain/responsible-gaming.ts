import { callRpc } from '../lib/rpc';

export async function setRgLimit(
  limitKind: 'loss' | 'deposit',
  domain: string,
  currency: string,
  amount: string,
): Promise<{ pending?: boolean; current_limit?: string }> {
  const data = await callRpc('rpc_set_rg_limit', {
    p_limit_kind: limitKind,
    p_domain: domain,
    p_currency: currency,
    p_amount: amount,
  });
  return data as { pending?: boolean; current_limit?: string };
}

export async function setSelfExclusion(untilIso: string, reason: string): Promise<{ exclusion_id?: string }> {
  const data = await callRpc('rpc_set_self_exclusion', {
    p_excluded_until: untilIso,
    p_reason: reason,
  });
  return data as { exclusion_id?: string };
}
