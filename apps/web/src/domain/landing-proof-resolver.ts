/**
 * Landing proof tier resolver — fail-closed (C-01).
 * Synthetic ambient stats/testimonials/withdrawal rows stay hidden until verified live aggregates.
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

export type LandingWithdrawalProofMode = 'hidden' | 'presentation';

export type LandingAmbientSocialMode = 'hidden' | 'presentation';

export type LandingProofResolver = {
  readonly testimonials: LandingTestimonialsMode;
  readonly stats: LandingStatsMode;
  readonly walletPreview: 'presentation';
  readonly withdrawalMomentum: LandingWithdrawalMomentumMode;
  /** Masked withdrawal case rows — never factual without verified ledger aggregate. */
  readonly withdrawalProof: LandingWithdrawalProofMode;
  /** Signup concurrency bot + ambient ticker — hidden without live feed. */
  readonly ambientSocial: LandingAmbientSocialMode;
};

export function resolveLandingProof(options?: {
  liveMemberCount?: number;
  testimonialsMode?: LandingTestimonialsMode;
  proofMode?: LandingLiveProofMode;
}): LandingProofResolver {
  const proofMode = options?.proofMode ?? resolveLandingLiveProofModeFromEnv();
  const liveCount = options?.liveMemberCount;

  const hasVerifiedLiveStats =
    proofMode === 'live' &&
    liveCount !== undefined &&
    liveCount >= LANDING_CUMULATIVE_STATS_THRESHOLD;

  /** Presentation synthetic stats are never default-on (audit C-01 fail-closed). */
  const stats: LandingStatsMode = hasVerifiedLiveStats ? 'live' : 'hidden';

  let testimonials: LandingTestimonialsMode = 'hidden';
  if (
    proofMode === 'live' &&
    LANDING_TESTIMONIAL_POOL.length > 0 &&
    options?.testimonialsMode !== 'hidden'
  ) {
    testimonials = 'verified';
  }

  return {
    testimonials,
    stats,
    walletPreview: 'presentation',
    withdrawalMomentum: proofMode === 'live' ? 'live' : 'hidden',
    withdrawalProof: 'hidden',
    ambientSocial: 'hidden',
  };
}
