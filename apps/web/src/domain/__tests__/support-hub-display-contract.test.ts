import { describe, expect, it } from 'vitest';

import {
  SUPPORT_CONTACT_EMAIL,
  SUPPORT_FAQ_ITEM_IDS,
  SUPPORT_FAQ_ROUTE,
  SUPPORT_HUB_ROUTE,
  SUPPORT_TICKET_ROUTE,
  assertSupportHubContractSync,
  buildSupportMailtoHref,
  shouldDeferSupportTicket,
  supportFaqAnswerKey,
  supportFaqQuestionKey,
} from '../support-hub-display-contract';

describe('support-hub-display-contract', () => {
  it('binds support routes and keeps ticket live after E10', () => {
    expect(SUPPORT_HUB_ROUTE).toBe('/support');
    expect(SUPPORT_FAQ_ROUTE).toBe('/support/faq');
    expect(SUPPORT_TICKET_ROUTE).toBe('/support/ticket');
    expect(SUPPORT_CONTACT_EMAIL).toBe('support@phonara.net');
    expect(shouldDeferSupportTicket()).toBe(false);
    expect(SUPPORT_FAQ_ITEM_IDS).toHaveLength(6);
    expect(supportFaqQuestionKey(1)).toBe('faq.q1');
    expect(supportFaqAnswerKey(6)).toBe('faq.a6');
    expect(buildSupportMailtoHref('Hello')).toContain('mailto:support@phonara.net');
    expect(() => assertSupportHubContractSync()).not.toThrow();
  });
});
