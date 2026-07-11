import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import {
  type ReferralLeaderboardSnapshot,
  type ReferralLeaderboardWindow,
  isReferralLeaderboardRankListLive,
  parseAffiliateRankLeaderboard,
  REFERRAL_LEADERBOARD_DEFAULT_LIMIT,
  REFERRAL_LEADERBOARD_DEFAULT_WINDOW,
  REFERRAL_LEADERBOARD_ENGINE_RPC,
  REFERRAL_LEADERBOARD_ERROR_KEY,
  shouldDeferReferralLeaderboard,
} from '@/domain/referral-leaderboard-display-contract';
import { AFFILIATE_RANK_WINDOWS } from '@/domain/viral-cms-display-contract';
import { callRpc } from '@/lib/rpc';
import { translateError } from '@/lib/translate-error';
import { useT } from '@/product/i18n';

export const referralLeaderboardKeys = {
  list: (userId: string | null, window: ReferralLeaderboardWindow) =>
    ['referral-leaderboard', userId, window] as const,
};

async function fetchReferralLeaderboard(
  window: ReferralLeaderboardWindow,
): Promise<ReferralLeaderboardSnapshot> {
  const data = await callRpc(REFERRAL_LEADERBOARD_ENGINE_RPC, {
    p_limit: REFERRAL_LEADERBOARD_DEFAULT_LIMIT,
    p_window: window,
  });
  const parsed = parseAffiliateRankLeaderboard(data, window);
  if (!parsed) {
    throw new Error('REFERRAL_LEADERBOARD_PARSE');
  }
  return parsed;
}

export type ReferralLeaderboardControllerView = {
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  deferred: boolean;
  live: boolean;
  window: ReferralLeaderboardWindow;
  windows: readonly ReferralLeaderboardWindow[];
  setWindow: (window: ReferralLeaderboardWindow) => void;
  loading: boolean;
  errorKey: MessageKey | null;
  snapshot: ReferralLeaderboardSnapshot | null;
  refresh: () => void;
};

export function useReferralLeaderboardController(): ReferralLeaderboardControllerView {
  const t = useT();
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const deferred = shouldDeferReferralLeaderboard();
  const live = isReferralLeaderboardRankListLive();
  const [window, setWindow] = useState<ReferralLeaderboardWindow>(
    REFERRAL_LEADERBOARD_DEFAULT_WINDOW,
  );

  const query = useQuery({
    queryKey: referralLeaderboardKeys.list(userId, window),
    queryFn: () => fetchReferralLeaderboard(window),
    enabled: live && !deferred && Boolean(userId),
  });

  const errorKey = query.error
    ? translateError(query.error, REFERRAL_LEADERBOARD_ERROR_KEY)
    : null;

  return {
    t,
    deferred,
    live,
    window,
    windows: AFFILIATE_RANK_WINDOWS,
    setWindow,
    loading: query.isLoading,
    errorKey,
    snapshot: query.data ?? null,
    refresh: () => {
      void query.refetch();
    },
  };
}
