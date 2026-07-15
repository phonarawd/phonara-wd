/**
 * §3.5 Platform narrative — positioning · pillars · trust key prefixes.
 * Authority: docs/SSOT/PLATFORM_NARRATIVE_CANON.md
 */

import type { MessageKey } from '@phonara/i18n';

export const PLATFORM_PRODUCT_NAME = 'PHONARA' as const;
export const PLATFORM_ENGINE_NAME = 'PHONARA' as const;

export type PlatformPillarId = 'earn' | 'wallet' | 'play';

export const PLATFORM_PILLAR_IDS: readonly PlatformPillarId[] = ['earn', 'wallet', 'play'] as const;

export const PLATFORM_POSITIONING_KEY_PREFIX = 'platform.positioning' as const;
export const PLATFORM_PILLARS_KEY_PREFIX = 'platform.pillars' as const;

/** Canonical hero / signup subhead keys (`p3-platform-narrative-i18n` · §28). */
export const PLATFORM_POSITIONING_KEYS = {
  eyebrow: 'platform.positioning.eyebrow',
  headline: 'platform.positioning.headline',
  subhead: 'platform.positioning.subhead',
  cta: 'platform.positioning.cta',
  pageTitle: 'platform.positioning.pageTitle',
} as const satisfies Record<string, MessageKey>;

export type PlatformPillarMessageKeys = {
  readonly titleKey: `platform.pillars.${PlatformPillarId}.title`;
  readonly descKey: `platform.pillars.${PlatformPillarId}.desc`;
};

export const PLATFORM_PILLAR_CONTENT: Readonly<
  Record<PlatformPillarId, PlatformPillarMessageKeys>
> = {
  earn: { titleKey: 'platform.pillars.earn.title', descKey: 'platform.pillars.earn.desc' },
  wallet: { titleKey: 'platform.pillars.wallet.title', descKey: 'platform.pillars.wallet.desc' },
  play: { titleKey: 'platform.pillars.play.title', descKey: 'platform.pillars.play.desc' },
};

export const PLATFORM_PILLARS_SECTION_TITLE_KEY = 'platform.pillars.sectionTitle' as const;
export const PLATFORM_PILLARS_SECTION_SUBTITLE_KEY = 'platform.pillars.sectionSubtitle' as const;
export const PLATFORM_TRUST_KEY_PREFIX = 'platform.trust' as const;
export const TIER_BENEFITS_NARRATIVE_KEY_PREFIX = 'tier.benefits.narrative' as const;
export const TRUST_HUB_KEY_PREFIX = 'trust.hub' as const;

/** Canonical routes per pillar — navigate only from Earn cards. */
export const PLATFORM_PILLAR_ROUTES: Readonly<Record<PlatformPillarId, string>> = {
  earn: '/home',
  wallet: '/wallet',
  play: '/trade',
};

/**
 * E-Wave STUB routes — hidden from IA until engine/UI unlock (§22.5).
 * `/wallet/transfer` · `/settings/api-keys` = `ew-e10-wallet-settings-ui`.
 * `/support/ticket` · `/status` · `/tier/leaderboard` = `ew-e10-trust-support-ui`.
 */
export const PLATFORM_EWAVE_HIDDEN_ROUTES = ['/support/chat', '/points/shop'] as const;

/** i18n key prefixes wired by platform canon (`p6-doc-platform-canon-sync` · `p3-platform-narrative-i18n`). */
export const PLATFORM_NARRATIVE_KEY_PREFIXES = [
  PLATFORM_POSITIONING_KEY_PREFIX,
  PLATFORM_PILLARS_KEY_PREFIX,
  PLATFORM_TRUST_KEY_PREFIX,
  TIER_BENEFITS_NARRATIVE_KEY_PREFIX,
  TRUST_HUB_KEY_PREFIX,
] as const;

/** All platform narrative copy keys — must exist in `@phonara/i18n` ko+en. */
export function listPlatformNarrativeMessageKeys(): readonly MessageKey[] {
  const pillarKeys = PLATFORM_PILLAR_IDS.flatMap((id) => [
    `platform.pillars.${id}.title` as MessageKey,
    `platform.pillars.${id}.desc` as MessageKey,
  ]);
  return [
    ...Object.values(PLATFORM_POSITIONING_KEYS),
    PLATFORM_PILLARS_SECTION_TITLE_KEY,
    PLATFORM_PILLARS_SECTION_SUBTITLE_KEY,
    ...pillarKeys,
    'platform.trust.ledger' as MessageKey,
    'platform.trust.pf' as MessageKey,
    'platform.trust.rg' as MessageKey,
  ];
}
