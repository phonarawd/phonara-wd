import { callRpc } from '@/lib/rpc';

type EarnHubStatusPayload = {
  tier?: string;
};

export async function fetchEarnHubTier(): Promise<string | null> {
  const data = await callRpc('rpc_get_earn_hub_status');
  const payload = (data ?? {}) as EarnHubStatusPayload;
  return payload.tier ?? null;
}
