/**
 * `/support` · `/support/faq` · `/support/ticket` STUB — P12 community support hub.
 * Live: mailto + FAQ i18n · Ticket = E9 defer stub.
 */

import type { MessageKey } from '@phonara/i18n';

import { PLATFORM_EWAVE_HIDDEN_ROUTES } from './platform-narrative-display-contract';

export const SUPPORT_HUB_ROUTE = '/support' as const;
export const SUPPORT_FAQ_ROUTE = '/support/faq' as const;
export const SUPPORT_TICKET_ROUTE = '/support/ticket' as const;

/** Matches `support.email.value` i18n — mailto href SOT (not parsed from copy). */
export const SUPPORT_CONTACT_EMAIL = 'support@phonara.net' as const;

export const SUPPORT_HUB_SEO_TITLE_KEY = 'support.hub.head.title' as const satisfies MessageKey;
export const SUPPORT_HUB_SEO_DESCRIPTION_KEY = 'support.hub.head.desc' as const satisfies MessageKey;

export const SUPPORT_FAQ_SEO_TITLE_KEY = 'faq.title' as const satisfies MessageKey;
export const SUPPORT_FAQ_SEO_DESCRIPTION_KEY = 'faq.subtitle' as const satisfies MessageKey;

export const SUPPORT_TICKET_SEO_TITLE_KEY =
  'support.ticket.head.title' as const satisfies MessageKey;
export const SUPPORT_TICKET_SEO_DESCRIPTION_KEY =
  'support.ticket.head.desc' as const satisfies MessageKey;

export const SUPPORT_TICKET_DEFER_TITLE_KEY =
  'support.ticket.defer.title' as const satisfies MessageKey;
export const SUPPORT_TICKET_DEFER_BODY_KEY =
  'support.ticket.defer.body' as const satisfies MessageKey;

export const SUPPORT_TICKET_ENGINE_TODO = 'ew-e9-identity-wave' as const;
export const SUPPORT_TICKET_UI_UNLOCK_TODO = 'ew-e9-page-admin-support' as const;

/** FAQ accordion ids — maps to `faq.qN` / `faq.aN`. */
export const SUPPORT_FAQ_ITEM_IDS = [1, 2, 3, 4, 5, 6] as const;

export type SupportFaqItemId = (typeof SUPPORT_FAQ_ITEM_IDS)[number];

export function supportFaqQuestionKey(id: SupportFaqItemId): MessageKey {
  return `faq.q${id}` as MessageKey;
}

export function supportFaqAnswerKey(id: SupportFaqItemId): MessageKey {
  return `faq.a${id}` as MessageKey;
}

export function buildSupportMailtoHref(subject: string): string {
  return `mailto:${SUPPORT_CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}

export function shouldDeferSupportTicket(): boolean {
  return (PLATFORM_EWAVE_HIDDEN_ROUTES as readonly string[]).includes(SUPPORT_TICKET_ROUTE);
}

export function assertSupportHubContractSync(): void {
  if (SUPPORT_HUB_ROUTE !== '/support') {
    throw new Error('support-hub: hub route drift');
  }
  if (SUPPORT_FAQ_ROUTE !== '/support/faq') {
    throw new Error('support-hub: faq route drift');
  }
  if (SUPPORT_TICKET_ROUTE !== '/support/ticket') {
    throw new Error('support-hub: ticket route drift');
  }
  if (!shouldDeferSupportTicket()) {
    throw new Error('support-hub: /support/ticket must stay deferred until E9');
  }
  if (SUPPORT_FAQ_ITEM_IDS.length !== 6) {
    throw new Error('support-hub: FAQ item count drift');
  }
}
