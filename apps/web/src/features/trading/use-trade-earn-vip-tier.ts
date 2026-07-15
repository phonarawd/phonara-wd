import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/auth-context';
import { parseEarnHubTierSnapshot } from '@/domain/tier-me-display-contract';
import { EARN_HUB_STATUS_RPC, type EarnVipTier } from '@/domain/unified-tier-display-contract';
import { callRpc } from '@/lib/rpc';

export const tradeEarnVipTierKeys = {
  tier: (userId: string | null) => ['trade-earn-vip-tier', userId] as const,
};

async function fetchTradeEarnVipTier(): Promise<EarnVipTier> {
  const data = await callRpc(EARN_HUB_STATUS_RPC);
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
