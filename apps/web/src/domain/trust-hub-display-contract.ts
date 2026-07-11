/**
 * `/security` — public trust center narrative (P12 · §3.5 · Financial tone · emoji 0).
 * Authority: PLATFORM_NARRATIVE_CANON §4 · platform-narrative-display-contract.
 */

import type { MessageKey } from '@phonara/i18n';

import { PLATFORM_EWAVE_HIDDEN_ROUTES } from './platform-narrative-display-contract';

export const TRUST_HUB_ROUTE = '/security' as const;

export const TRUST_HUB_SEO_TITLE_KEY = 'trust.hub.head.title' as const satisfies MessageKey;
export const TRUST_HUB_SEO_DESCRIPTION_KEY = 'trust.hub.head.desc' as const satisfies MessageKey;

export const TRUST_HUB_KEY_PREFIX = 'trust.hub' as const;
export const PLATFORM_TRUST_KEY_PREFIX = 'platform.trust' as const;

/** Trust narrative blocks — factual · no unverifiable safety claims. */
export const TRUST_HUB_BLOCK_IDS = [
  'money',
  'fairness',
  'rg',
  'kyc',
  'status',
] as const;

export type TrustHubBlockId = (typeof TRUST_HUB_BLOCK_IDS)[number];

export type TrustHubBlock = {
  readonly id: TrustHubBlockId;
  readonly titleKey: MessageKey;
  readonly bodyKey: MessageKey;
  /** Navigate-only when live; null = deferred copy only. */
  readonly href: string | null;
  readonly linkKey: MessageKey | null;
  readonly deferred: boolean;
};

export const TRUST_HUB_FAIRNESS_ROUTE = '/casino/fairness' as const;
export const TRUST_HUB_RG_ROUTE = '/account/responsible-gaming' as const;
export const TRUST_HUB_KYC_ROUTE = '/account/kyc' as const;
export const TRUST_HUB_STATUS_ROUTE = '/status' as const;

export const TRUST_HUB_BLOCKS: readonly TrustHubBlock[] = [
  {
    id: 'money',
    titleKey: 'trust.hub.block.money.title',
    bodyKey: 'trust.hub.block.money.body',
    href: null,
    linkKey: null,
    deferred: false,
  },
  {
    id: 'fairness',
    titleKey: 'trust.hub.block.fairness.title',
    bodyKey: 'trust.hub.block.fairness.body',
    href: TRUST_HUB_FAIRNESS_ROUTE,
    linkKey: 'trust.hub.block.fairness.link',
    deferred: false,
  },
  {
    id: 'rg',
    titleKey: 'trust.hub.block.rg.title',
    bodyKey: 'trust.hub.block.rg.body',
    href: TRUST_HUB_RG_ROUTE,
    linkKey: 'trust.hub.block.rg.link',
    deferred: false,
  },
  {
    id: 'kyc',
    titleKey: 'trust.hub.block.kyc.title',
    bodyKey: 'trust.hub.block.kyc.body',
    href: TRUST_HUB_KYC_ROUTE,
    linkKey: 'trust.hub.block.kyc.link',
    deferred: false,
  },
  {
    id: 'status',
    titleKey: 'trust.hub.block.status.title',
    bodyKey: 'trust.hub.block.status.body',
    href: null,
    linkKey: null,
    deferred: true,
  },
] as const;

/** Platform trust strip keys (landing / security shared). */
export const PLATFORM_TRUST_STRIP_KEYS = [
  'platform.trust.ledger',
  'platform.trust.pf',
  'platform.trust.rg',
] as const satisfies readonly MessageKey[];

export function listTrustHubMessageKeys(): readonly MessageKey[] {
  const blockKeys = TRUST_HUB_BLOCKS.flatMap((block) => {
    const keys: MessageKey[] = [block.titleKey, block.bodyKey];
    if (block.linkKey) keys.push(block.linkKey);
    return keys;
  });
  return [
    TRUST_HUB_SEO_TITLE_KEY,
    TRUST_HUB_SEO_DESCRIPTION_KEY,
    'trust.hub.eyebrow',
    'trust.hub.lead',
    'trust.hub.stripAria',
    'trust.hub.blocksHeading',
    'trust.hub.deferred',
    ...blockKeys,
    ...PLATFORM_TRUST_STRIP_KEYS,
  ];
}

export function isTrustHubStatusDeferred(): boolean {
  return (PLATFORM_EWAVE_HIDDEN_ROUTES as readonly string[]).includes(TRUST_HUB_STATUS_ROUTE);
}

export function assertTrustHubContractSync(): void {
  if (TRUST_HUB_ROUTE !== '/security') {
    throw new Error('trust-hub: route drift');
  }
  if (TRUST_HUB_BLOCKS.length !== 5) {
    throw new Error('trust-hub: block count drift');
  }
  if (!isTrustHubStatusDeferred()) {
    throw new Error('trust-hub: /status must stay deferred until E10');
  }
  const statusBlock = TRUST_HUB_BLOCKS.find((b) => b.id === 'status');
  if (!statusBlock?.deferred || statusBlock.href != null) {
    throw new Error('trust-hub: status block must be deferred with no live href');
  }
}
