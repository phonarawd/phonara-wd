import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/auth-context';
import { parseEarnHubTierSnapshot } from '@/domain/tier-me-display-contract';
import { TIER_FEE_EARN_HUB_RPC } from '@/domain/tier-fee-display-contract';
import type { EarnVipTier } from '@/domain/unified-tier-display-contract';
import { supabase } from '@/lib/supabase';

export const tradeEarnVipTierKeys = {
  tier: (userId: string | null) => ['trade-earn-vip-tier', userId] as const,
};

async function fetchTradeEarnVipTier(): Promise<EarnVipTier> {
  const { data, error } = await supabase.rpc(TIER_FEE_EARN_HUB_RPC);
  if (error) throw error;
  const snapshot = parseEarnHubTierSnapshot((data ?? {}) as Record<string, unknown>);
  return snapshot?.tier ?? 'bronze';
}

/** Earn VIP tier for trade ticket badge — display-only (`rpc_get_earn_hub_status.tier`). */
export function useTradeEarnVipTier() {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  return useQuery({
    queryKey: tradeEarnVipTierKeys.tier(userId),
    queryFn: fetchTradeEarnVipTier,
    enabled: Boolean(userId),
    staleTime: 20_000,
  });
}
