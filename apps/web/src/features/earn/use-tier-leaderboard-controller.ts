import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/contexts/auth-context';
import {
  isTierLeaderboardRankListLive,
  parseTierLeaderboard,
  TIER_LEADERBOARD_DEFAULT_LIMIT,
  TIER_LEADERBOARD_ENGINE_RPC,
  TIER_LEADERBOARD_ERROR_KEY,
  type TierLeaderboardSnapshot,
} from '@/domain/tier-leaderboard-display-contract';
import { callRpc } from '@/lib/rpc';
import { translateError } from '@/lib/translate-error';
import { useT } from '@/product/i18n';
import type { MessageKey } from '@phonara/i18n';

export const tierLeaderboardKeys = {
  list: (userId: string | null) => ['tier-leaderboard', userId] as const,
};

async function fetchTierLeaderboard(): Promise<TierLeaderboardSnapshot> {
  const data = await callRpc(TIER_LEADERBOARD_ENGINE_RPC, {
    p_limit: TIER_LEADERBOARD_DEFAULT_LIMIT,
  });
  const parsed = parseTierLeaderboard(data);
  if (!parsed) {
    throw new Error('TIER_LEADERBOARD_PARSE');
  }
  return parsed;
}

export type TierLeaderboardControllerView = {
  t: ReturnType<typeof useT>;
  live: boolean;
  loading: boolean;
  errorKey: MessageKey | null;
  snapshot: TierLeaderboardSnapshot | null;
  refresh: () => void;
};

export function useTierLeaderboardController(): TierLeaderboardControllerView {
  const t = useT();
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const live = isTierLeaderboardRankListLive();

  const query = useQuery({
    queryKey: tierLeaderboardKeys.list(userId),
    queryFn: fetchTierLeaderboard,
    enabled: live && Boolean(userId),
  });

  const errorKey = query.error ? translateError(query.error, TIER_LEADERBOARD_ERROR_KEY) : null;

  return {
    t,
    live,
    loading: query.isLoading,
    errorKey,
    snapshot: query.data ?? null,
    refresh: () => {
      void query.refetch();
    },
  };
}
