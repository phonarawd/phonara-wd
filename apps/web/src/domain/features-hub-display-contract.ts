/**
 * `/features` · `/features/earn` · `/features/vip` — public product intro (P12 · ui_only).
 * Navigate-only CTAs — no cross-domain embed.
 */

import type { MessageKey } from '@phonara/i18n';

export const FEATURES_HUB_ROUTE = '/features' as const;
export const FEATURES_EARN_ROUTE = '/features/earn' as const;
export const FEATURES_VIP_ROUTE = '/features/vip' as const;

export const FEATURES_HUB_SEO_TITLE_KEY = 'features.hub.head.title' as const satisfies MessageKey;
export const FEATURES_HUB_SEO_DESCRIPTION_KEY =
  'features.hub.head.desc' as const satisfies MessageKey;

export const FEATURES_EARN_SEO_TITLE_KEY = 'features.earn.head.title' as const satisfies MessageKey;
export const FEATURES_EARN_SEO_DESCRIPTION_KEY =
  'features.earn.head.desc' as const satisfies MessageKey;

export const FEATURES_VIP_SEO_TITLE_KEY = 'features.vip.head.title' as const satisfies MessageKey;
export const FEATURES_VIP_SEO_DESCRIPTION_KEY =
  'features.vip.head.desc' as const satisfies MessageKey;

export type FeaturesHubCardId = 'earn' | 'vip' | 'tier' | 'fees' | 'security' | 'trade';

export type FeaturesHubCard = {
  readonly id: FeaturesHubCardId;
  readonly route: string;
  readonly titleKey: MessageKey;
  readonly bodyKey: MessageKey;
};

/** Hub cards — navigate only (§12.19). */
export const FEATURES_HUB_CARDS: readonly FeaturesHubCard[] = [
  {
    id: 'earn',
    route: FEATURES_EARN_ROUTE,
    titleKey: 'features.hub.card.earn.title',
    bodyKey: 'features.hub.card.earn.body',
  },
  {
    id: 'vip',
    route: FEATURES_VIP_ROUTE,
    titleKey: 'features.hub.card.vip.title',
    bodyKey: 'features.hub.card.vip.body',
  },
  {
    id: 'tier',
    route: '/tier',
    titleKey: 'features.hub.card.tier.title',
    bodyKey: 'features.hub.card.tier.body',
  },
  {
    id: 'fees',
    route: '/fees',
    titleKey: 'features.hub.card.fees.title',
    bodyKey: 'features.hub.card.fees.body',
  },
  {
    id: 'security',
    route: '/security',
    titleKey: 'features.hub.card.security.title',
    bodyKey: 'features.hub.card.security.body',
  },
  {
    id: 'trade',
    route: '/trade',
    titleKey: 'features.hub.card.trade.title',
    bodyKey: 'features.hub.card.trade.body',
  },
] as const;

export const FEATURES_EARN_CTA_ROUTE = '/home' as const;
export const FEATURES_VIP_CTA_ROUTE = '/tier' as const;

export function assertFeaturesHubContractSync(): void {
  if (FEATURES_HUB_ROUTE !== '/features') {
    throw new Error('features-hub: hub route drift');
  }
  if (FEATURES_EARN_ROUTE !== '/features/earn') {
    throw new Error('features-hub: earn route drift');
  }
  if (FEATURES_VIP_ROUTE !== '/features/vip') {
    throw new Error('features-hub: vip route drift');
  }
  if (FEATURES_HUB_CARDS.length !== 6) {
    throw new Error('features-hub: card count drift');
  }
}
