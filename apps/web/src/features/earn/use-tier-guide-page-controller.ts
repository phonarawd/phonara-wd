import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import {
  buildTierGuideRows,
  TIER_GUIDE_FAQ_IDS,
  type TierGuideFaqId,
} from '@/domain/tier-guide-display-contract';
import {
  parseEarnHubTierSnapshot,
  type TierBenefitsPreviewRow,
} from '@/domain/tier-me-display-contract';
import { type EarnVipTier } from '@/domain/unified-tier-display-contract';
import { callRpc } from '@/lib/rpc';
import { translateError } from '@/lib/translate-error';
import { useT } from '@/product/i18n';

export const tierGuidePageKeys = {
  snapshot: (userId: string | null) => ['tier-guide-snapshot', userId] as const,
};

async function fetchTierGuideSnapshot(): Promise<EarnVipTier> {
  const data = await callRpc('rpc_get_earn_hub_status');
  const tierSnapshot = parseEarnHubTierSnapshot((data ?? {}) as Record<string, unknown>);
  return tierSnapshot?.tier ?? 'bronze';
}

export type TierGuidePageControllerView = {
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  loading: boolean;
  error: MessageKey | null;
  authenticated: boolean;
  currentTier: EarnVipTier | null;
  rows: TierBenefitsPreviewRow[];
  faqIds: readonly TierGuideFaqId[];
};

/** Public `/tier` guide — RPC highlight when signed in · static ladder otherwise. */
export function useTierGuidePageController(): TierGuidePageControllerView {
  const t = useT();
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id ?? null;

  const {
    data: currentTier = null,
    isLoading: snapshotLoading,
    error: snapshotError,
  } = useQuery({
    queryKey: tierGuidePageKeys.snapshot(userId),
    queryFn: () => fetchTierGuideSnapshot(),
    enabled: Boolean(userId),
    staleTime: 20_000,
  });

  const rows = useMemo(() => buildTierGuideRows(currentTier), [currentTier]);

  return {
    t,
    loading: authLoading || (Boolean(userId) && snapshotLoading),
    error: snapshotError ? translateError(snapshotError) : null,
    authenticated: Boolean(userId),
    currentTier,
    rows,
    faqIds: TIER_GUIDE_FAQ_IDS,
  };
}
