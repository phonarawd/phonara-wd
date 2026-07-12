/**
 * Campaign landing `/` — Phase R P3 display contract (§28 · ui_only · engine 0).
 * Side-hustle positioning · cold-start social proof · returning-user routing companion.
 */

import type { MessageKey } from '@phonara/i18n';

import { EARN_STATIC_MISSIONS } from '@/data/earn-static-missions';

export const LANDING_SURFACE = 'apps/web/src/product/surfaces/landing/landing-page.tsx' as const;

export const LANDING_ENGINE_STATUS = 'ui_only' as const;

/**
 * Historical ambient/live flag — ambient presentation social proof is fail-closed (C-01).
 * Live aggregates only via `VITE_PHONARA_LANDING_PROOF_MODE=live` + verified counts.
 */
export type LandingProofMode = 'ambient' | 'live';

/** @deprecated Prefer `resolveLandingLiveProofModeFromEnv` — ambient never surfaces synthetic proof. */
export const LANDING_PROOF_MODE: LandingProofMode = 'ambient';

/** L3 cumulative stats hidden until operator threshold (§28.7). */
export const LANDING_CUMULATIVE_STATS_THRESHOLD = 100;

export const LANDING_ATTRIBUTION_QUERY_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'ttclid',
  'fbclid',
  'gclid',
] as const;

export type LandingAttributionQueryKey = (typeof LANDING_ATTRIBUTION_QUERY_KEYS)[number];

export type LandingMissionTeaser = {
  readonly id: string;
  readonly titleKey: MessageKey;
  readonly rewardLabel: string;
  readonly eligibilityKey: MessageKey;
};

/** Hero-adjacent Why strip — 4-step micro-flow (CVR §3.1). */
export const LANDING_WHY_FLOW_STEP_IDS = ['signup', 'mission', 'earn', 'withdraw'] as const;

export type LandingWhyFlowStepId = (typeof LANDING_WHY_FLOW_STEP_IDS)[number];

export function landingWhyFlowLabelKey(
  id: LandingWhyFlowStepId,
): `landing.why.flow.${LandingWhyFlowStepId}` {
  return `landing.why.flow.${id}`;
}

/** Benefit checklist — no competitor names (CVR §3.2). */
export const LANDING_DIFFERENTIATOR_IDS = [
  'attendance',
  'quiz',
  'referral',
  'variedMissions',
  'withdrawAnytime',
] as const;

export type LandingDifferentiatorId = (typeof LANDING_DIFFERENTIATOR_IDS)[number];

export function landingDiffLabelKey(
  id: LandingDifferentiatorId,
): `landing.diff.${LandingDifferentiatorId}` {
  return `landing.diff.${id}`;
}

/** Catalog difficulty presentation only — not user ratings (CVR §3.3). */
export type LandingMissionPreviewDifficulty = 1 | 2 | 3 | 4 | 5;

/** §13.10.3 LIVE catalog subset — no `soon` · no gambling-first growth missions on landing. */
export const LANDING_LIVE_MISSION_IDS = [
  'daily-quiz',
  'daily-todaySpin',
  'growth-completeProfile',
  'growth-kyc',
] as const;

export type LandingLiveMissionId = (typeof LANDING_LIVE_MISSION_IDS)[number];

/** Hero fold featured mission — quiz 3min +200 PHON (CVR §3.3). */
export const LANDING_MISSION_PREVIEW_FEATURED_ID =
  'daily-quiz' as const satisfies LandingLiveMissionId;

/** Hero fold compact companions (featured excluded). */
export const LANDING_MISSION_PREVIEW_COMPACT_IDS = [
  'daily-todaySpin',
  'growth-completeProfile',
] as const satisfies readonly LandingLiveMissionId[];

export const LANDING_MISSION_PREVIEW_DIFFICULTY: Readonly<
  Record<LandingLiveMissionId, LandingMissionPreviewDifficulty>
> = {
  'daily-quiz': 2,
  'daily-todaySpin': 1,
  'growth-completeProfile': 2,
  'growth-kyc': 3,
};

export const LANDING_MISSION_PREVIEW_DURATION_KEYS: Readonly<
  Record<LandingLiveMissionId, MessageKey>
> = {
  'daily-quiz': 'landing.missions.duration.quiz',
  'daily-todaySpin': 'landing.missions.duration.spin',
  'growth-completeProfile': 'landing.missions.duration.profile',
  'growth-kyc': 'landing.missions.duration.kyc',
};

const LANDING_ELIGIBILITY_KEYS: Readonly<Record<LandingLiveMissionId, MessageKey>> = {
  'daily-quiz': 'landing.missions.eligibility.daily',
  'daily-todaySpin': 'landing.missions.eligibility.daily',
  'growth-completeProfile': 'landing.missions.eligibility.profile',
  'growth-kyc': 'landing.missions.eligibility.kyc',
};

export const LANDING_MISSION_TEASERS: readonly LandingMissionTeaser[] =
  LANDING_LIVE_MISSION_IDS.map((id) => {
    const mission = EARN_STATIC_MISSIONS.find((row) => row.id === id);
    if (!mission) {
      throw new Error(`landing-display-contract: missing mission ${id}`);
    }
    const rewardPhon = parseLandingRewardPhon(mission.rewardLabel);
    return {
      id,
      titleKey: mission.titleKey as MessageKey,
      rewardLabel: formatLandingRewardPhonLabel(rewardPhon),
      eligibilityKey: LANDING_ELIGIBILITY_KEYS[id],
    };
  });

/** Presentation wallet preview amount — Decimal string · not user balance (CVR §3.4 · H-01). */
export const LANDING_WALLET_PREVIEW_PHON = '2900' as const;

/** L0a cumulative stats — presentation constants until live threshold (CVR §4). */
export const LANDING_CUMULATIVE_STAT_IDS = ['members', 'rewardsPaid', 'withdrawals'] as const;

export type LandingCumulativeStatId = (typeof LANDING_CUMULATIVE_STAT_IDS)[number];

export const LANDING_CUMULATIVE_STATS_PRESENTATION: Readonly<
  Record<Exclude<LandingCumulativeStatId, 'members'>, number>
> = {
  rewardsPaid: 156_800_000,
  withdrawals: 52_400,
};

/** Share of ambient ticker lines that simulate fresh signups (§28.7 bot). */
export const LANDING_AMBIENT_SIGNUP_LINE_RATIO = 0.38;

export function landingCumulativeStatLabelKey(
  id: LandingCumulativeStatId,
): `landing.stats.${LandingCumulativeStatId}.label` {
  return `landing.stats.${id}.label`;
}

export function landingCumulativeStatValueKey(
  id: LandingCumulativeStatId,
): `landing.stats.${LandingCumulativeStatId}.value` {
  return `landing.stats.${id}.value`;
}

/** Presentation withdrawal proof rows — masked nicks · not live ledger (CVR §4). */
export const LANDING_WITHDRAWAL_PROOF_IDS = ['row1', 'row2', 'row3'] as const;

export type LandingWithdrawalProofId = (typeof LANDING_WITHDRAWAL_PROOF_IDS)[number];

export function landingWithdrawalProofLineKey(
  id: LandingWithdrawalProofId,
): `landing.withdrawalProof.${LandingWithdrawalProofId}` {
  return `landing.withdrawalProof.${id}`;
}

/** Core FAQ — anxiety-order · emoji in i18n question strings (CVR §7). */
export const LANDING_FAQ_IDS = [
  'canGetPaid',
  'timeNeeded',
  'withdrawWhen',
  'howEarn',
  'signupFee',
  'privacy',
  'whoCanUse',
  'startNow',
] as const;

export const LANDING_FAQ_BONUS_IDS = ['whereWallet', 'missionsOptional', 'afterWithdraw'] as const;

export type LandingFaqCoreId = (typeof LANDING_FAQ_IDS)[number];

export type LandingFaqBonusId = (typeof LANDING_FAQ_BONUS_IDS)[number];

export type LandingFaqId = LandingFaqCoreId | LandingFaqBonusId;

export const LANDING_FAQ_ALL_IDS: readonly LandingFaqId[] = [
  ...LANDING_FAQ_IDS,
  ...LANDING_FAQ_BONUS_IDS,
];

export function landingFaqQuestionKey(id: LandingFaqId): `landing.faq.${LandingFaqId}.q` {
  return `landing.faq.${id}.q`;
}

export function landingFaqAnswerKey(id: LandingFaqId): `landing.faq.${LandingFaqId}.a` {
  return `landing.faq.${id}.a`;
}

/** L5 operator-approved testimonial pool — 0 rows → section hidden (CVR §3.5). */
export type LandingTestimonialEntry = {
  readonly id: string;
  readonly nameKey: MessageKey;
  readonly quoteKey: MessageKey;
  readonly rating: 4 | 5;
};

export const LANDING_TESTIMONIAL_POOL: readonly LandingTestimonialEntry[] = [
  {
    id: 't1',
    nameKey: 'landing.testimonial.t1.name',
    quoteKey: 'landing.testimonial.t1.quote',
    rating: 5,
  },
  {
    id: 't2',
    nameKey: 'landing.testimonial.t2.name',
    quoteKey: 'landing.testimonial.t2.quote',
    rating: 5,
  },
  {
    id: 't3',
    nameKey: 'landing.testimonial.t3.name',
    quoteKey: 'landing.testimonial.t3.quote',
    rating: 4,
  },
];

/** Parse catalog/landing reward label like "+200P" / "+200 PHON" → integer PHON (display only). */
export function parseLandingRewardPhon(rewardLabel: string): number {
  const digits = rewardLabel.replace(/[^\d]/g, '');
  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Landing-path reward label — PHON only · never bare `P` (M-01). */
export function formatLandingRewardPhonLabel(amount: number): string {
  return `+${formatLandingPhonAmount(amount)} PHON`;
}

export function sumLandingAvailableRewardsPhon(
  missions: readonly LandingMissionTeaser[] = LANDING_MISSION_TEASERS,
): number {
  return missions.reduce(
    (total, mission) => total + parseLandingRewardPhon(mission.rewardLabel),
    0,
  );
}

/** Decimal string for MoneyDisplay — catalog sum is display-only (not ledger). */
export function sumLandingAvailableRewardsPhonString(
  missions: readonly LandingMissionTeaser[] = LANDING_MISSION_TEASERS,
): string {
  return String(sumLandingAvailableRewardsPhon(missions));
}

export function findLandingMissionTeaser(missionId: LandingLiveMissionId): LandingMissionTeaser {
  const mission = LANDING_MISSION_TEASERS.find((row) => row.id === missionId);
  if (!mission) {
    throw new Error(`landing-display-contract: missing mission teaser ${missionId}`);
  }
  return mission;
}

export function formatLandingPhonAmount(amount: number): string {
  return amount.toLocaleString('en-US');
}

export function formatLandingKrwAmount(amount: number): string {
  return amount.toLocaleString('ko-KR');
}

export function preserveLandingAttributionSearch(
  search: URLSearchParams | string,
): Record<string, string> {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search;
  const preserved: Record<string, string> = {};
  for (const key of LANDING_ATTRIBUTION_QUERY_KEYS) {
    const value = params.get(key);
    if (value) preserved[key] = value;
  }
  const variant = params.get('v');
  if (variant === 'a' || variant === 'b') preserved['v'] = variant;
  return preserved;
}

export function buildLandingSignupHref(search: URLSearchParams | string = ''): string {
  const preserved = preserveLandingAttributionSearch(search);
  const query = new URLSearchParams(preserved).toString();
  return query ? `/signup?${query}` : '/signup';
}
