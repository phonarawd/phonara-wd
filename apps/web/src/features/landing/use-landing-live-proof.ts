import { useQuery } from '@tanstack/react-query';

import {
  findLandingLiveCmsRow,
  LANDING_LIVE_CMS_KIND,
  LANDING_LIVE_CMS_SURFACE,
  LANDING_LIVE_MEMBER_COUNT_KEY,
  LANDING_LIVE_WITHDRAWAL_MOMENTUM_KEY,
  parseLandingLiveCmsCount,
  resolveLandingLiveProofModeFromEnv,
} from '@/domain/landing-live-display-contract';
import { resolveLandingProof } from '@/domain/landing-proof-resolver';
import { CMS_LIST_RPC } from '@/domain/cms-banners-display-contract';
import { supabase } from '@/lib/supabase';

type LandingLiveCmsRow = {
  content_key: string;
  body: string | null;
};

type LooseRpcResult = PromiseLike<{ data: unknown; error: { message: string } | null }>;
function rpc(name: string, args: Record<string, unknown>): LooseRpcResult {
  return supabase.rpc(name as never, args as never) as LooseRpcResult;
}

async function fetchLandingLiveProofRows(locale: string): Promise<readonly LandingLiveCmsRow[]> {
  const { data, error } = await rpc(CMS_LIST_RPC, {
    p_kind: LANDING_LIVE_CMS_KIND,
    p_surface: LANDING_LIVE_CMS_SURFACE,
    p_locale: locale,
  });
  if (error) throw error;
  return (data ?? []) as LandingLiveCmsRow[];
}

/** LIVE proof reads — CMS-backed L0b momentum · member count (Phase 4 · anon-safe RPC). */
export function useLandingLiveProof(locale = 'ko') {
  const proofMode = resolveLandingLiveProofModeFromEnv();
  const proof = resolveLandingProof({ proofMode });

  const query = useQuery({
    queryKey: ['landing-live-proof', locale, proofMode],
    queryFn: () => fetchLandingLiveProofRows(locale),
    enabled: proofMode === 'live',
    staleTime: 60_000,
  });

  const rows = query.data ?? [];
  const withdrawalMomentumCount = parseLandingLiveCmsCount(
    findLandingLiveCmsRow(rows, LANDING_LIVE_WITHDRAWAL_MOMENTUM_KEY)?.body,
  );
  const liveMemberCount = parseLandingLiveCmsCount(
    findLandingLiveCmsRow(rows, LANDING_LIVE_MEMBER_COUNT_KEY)?.body,
  );

  return {
    proofMode,
    proof,
    withdrawalMomentumCount,
    liveMemberCount,
    isLoading: query.isLoading,
    isLive: proofMode === 'live',
  };
}
