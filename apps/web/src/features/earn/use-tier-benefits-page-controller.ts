import { useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { MessageKey } from '@phonara/i18n';

import { useAuth } from '@/contexts/auth-context';
import {
  buildTierDecayPolicyRows,
  buildUnifiedTierBenefitsRows,
  listVisibleTierBenefitColumns,
  TIER_BENEFITS_NARRATIVE_STEPS,
  type TierBenefitColumnDef,
  type TierBenefitsNarrativeStep,
  type TierDecayPolicyRow,
} from '@/domain/tier-benefits-display-contract';
import {
  parseEarnHubTierSnapshot,
  type EarnHubTierSnapshot,
  type TierBenefitsPreviewRow,
} from '@/domain/tier-me-display-contract';
import { normalizeEarnVipTier, type EarnVipTier } from '@/domain/unified-tier-display-contract';
import { callRpc } from '@/lib/rpc';
import { translateError } from '@/lib/translate-error';
import { useT } from '@/product/i18n';

export const tierBenefitsPageKeys = {
  snapshot: (userId: string | null) => ['tier-benefits-snapshot', userId] as const,
};

type TierBenefitsSnapshot = EarnHubTierSnapshot;

async function fetchTierBenefitsSnapshot(): Promise<TierBenefitsSnapshot> {
  const data = await callRpc('rpc_get_earn_hub_status');

  const hubPayload = (data ?? {}) as Record<string, unknown>;
  const tierSnapshot = parseEarnHubTierSnapshot(hubPayload);
  if (!tierSnapshot) {
    throw new Error('TIER_SNAPSHOT_MISSING');
  }

  return tierSnapshot;
}

export type TierBenefitsPageControllerView = {
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  loading: boolean;
  error: MessageKey | null;
  currentTier: EarnVipTier;
  tierSnapshot: TierBenefitsSnapshot | null;
  narrativeSteps: readonly TierBenefitsNarrativeStep[];
  benefitRows: TierBenefitsPreviewRow[];
  visibleColumns: readonly TierBenefitColumnDef[];
  decayPolicies: TierDecayPolicyRow[];
};

export function useTierBenefitsPageController(): TierBenefitsPageControllerView {
  const t = useT();
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id ?? null;

  const {
    data: snapshot = null,
    isLoading: snapshotLoading,
    error: snapshotError,
  } = useQuery({
    queryKey: tierBenefitsPageKeys.snapshot(userId),
    queryFn: () => fetchTierBenefitsSnapshot(),
    enabled: Boolean(userId),
    staleTime: 20_000,
  });

  const currentTier = snapshot?.tier ?? 'bronze';

  const benefitRows = useMemo(() => buildUnifiedTierBenefitsRows(currentTier), [currentTier]);

  const visibleColumns = useMemo(() => listVisibleTierBenefitColumns(), []);
  const decayPolicies = useMemo(() => buildTierDecayPolicyRows(), []);

  const queryError = snapshotError ? translateError(snapshotError, 'error.UNKNOWN') : null;

  if (!authLoading && !session) {
    void navigate({ to: '/login', replace: true });
  }

  return {
    t,
    loading: authLoading || snapshotLoading,
    error: queryError,
    currentTier: normalizeEarnVipTier(currentTier),
    tierSnapshot: snapshot,
    narrativeSteps: TIER_BENEFITS_NARRATIVE_STEPS,
    benefitRows,
    visibleColumns,
    decayPolicies,
  };
}
