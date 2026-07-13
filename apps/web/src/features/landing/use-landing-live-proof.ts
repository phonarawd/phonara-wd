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
import { callRpc } from '@/lib/rpc';

type LandingLiveCmsRow = {
  content_key: string;
  body: string | null;
};

async function fetchLandingLiveProofRows(locale: string): Promise<readonly LandingLiveCmsRow[]> {
  const data = await callRpc(CMS_LIST_RPC, {
    p_kind: LANDING_LIVE_CMS_KIND,
    p_surface: LANDING_LIVE_CMS_SURFACE,
    p_locale: locale,
  });
  return data as LandingLiveCmsRow[];
}

/** LIVE proof reads — CMS-backed L0b momentum · member count (Phase 4 · anon-safe RPC). */
export function useLandingLiveProof(locale = 'ko') {
  const proofMode = resolveLandingLiveProofModeFromEnv();

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

  const proof = resolveLandingProof({
    proofMode,
    liveMemberCount: liveMemberCount ?? undefined,
  });

  return {
    proofMode,
    proof,
    withdrawalMomentumCount,
    liveMemberCount,
    isLoading: query.isLoading,
    isLive: proofMode === 'live',
  };
}
