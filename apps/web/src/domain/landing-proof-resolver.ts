/**
 * Landing proof tier resolver — presentation default · live operator flag (ADR-003 §5).
 */

import {
  LANDING_CUMULATIVE_STATS_THRESHOLD,
  LANDING_TESTIMONIAL_POOL,
} from '@/domain/landing-display-contract';
import {
  resolveLandingLiveProofModeFromEnv,
  type LandingLiveProofMode,
} from '@/domain/landing-live-display-contract';

export type LandingTestimonialsMode = 'hidden' | 'presentation' | 'verified';

export type LandingStatsMode = 'hidden' | 'presentation' | 'live';

export type LandingWithdrawalMomentumMode = 'hidden' | 'live';

export type LandingProofResolver = {
  readonly testimonials: LandingTestimonialsMode;
  readonly stats: LandingStatsMode;
  readonly walletPreview: 'presentation';
  readonly withdrawalMomentum: LandingWithdrawalMomentumMode;
};

export function resolveLandingProof(options?: {
  liveMemberCount?: number;
  testimonialsMode?: LandingTestimonialsMode;
  proofMode?: LandingLiveProofMode;
}): LandingProofResolver {
  const proofMode = options?.proofMode ?? resolveLandingLiveProofModeFromEnv();
  const liveCount = options?.liveMemberCount;
  const stats: LandingStatsMode =
    proofMode === 'live' ||
    (liveCount !== undefined && liveCount >= LANDING_CUMULATIVE_STATS_THRESHOLD)
      ? 'live'
      : 'presentation';

  let testimonials: LandingTestimonialsMode = options?.testimonialsMode ?? 'presentation';
  if (testimonials !== 'hidden' && LANDING_TESTIMONIAL_POOL.length === 0) {
    testimonials = 'hidden';
  }
  if (proofMode === 'live' && testimonials === 'presentation') {
    testimonials = 'verified';
  }

  return {
    testimonials,
    stats,
    walletPreview: 'presentation',
    withdrawalMomentum: proofMode === 'live' ? 'live' : 'hidden',
  };
}
