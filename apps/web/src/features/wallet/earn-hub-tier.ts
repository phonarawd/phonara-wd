import { supabase } from '@/lib/supabase';

type EarnHubStatusPayload = {
  tier?: string;
};

export async function fetchEarnHubTier(): Promise<string | null> {
  const { data, error } = await supabase.rpc('rpc_get_earn_hub_status');
  if (error) throw error;
  const payload = (data ?? {}) as EarnHubStatusPayload;
  return payload.tier ?? null;
}
