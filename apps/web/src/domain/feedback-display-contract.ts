/**
 * `/feedback` — ui_only mailto feedback · `/feedback?type=bug` bug report.
 * Alias `/report-bug` → `/feedback?type=bug` (route-redirect-registry).
 */

import type { MessageKey } from '@phonara/i18n';

import {
  SUPPORT_CONTACT_EMAIL,
  SUPPORT_FAQ_ROUTE,
  buildSupportMailtoHref,
} from './support-hub-display-contract';

export const FEEDBACK_ROUTE = '/feedback' as const;
export const FEEDBACK_BUG_SEARCH_TYPE = 'bug' as const;
export const FEEDBACK_FAQ_CTA_ROUTE = SUPPORT_FAQ_ROUTE;

export const FEEDBACK_SEO_TITLE_KEY = 'feedback.page.head.title' as const satisfies MessageKey;
export const FEEDBACK_SEO_DESCRIPTION_KEY = 'feedback.page.head.desc' as const satisfies MessageKey;

export type FeedbackPageType = 'general' | 'bug';

/** Optional search — omit `type` for general feedback (Link without search OK). */
export type FeedbackPageSearch = {
  type?: typeof FEEDBACK_BUG_SEARCH_TYPE;
};

export function parseFeedbackPageSearch(search: Record<string, unknown>): FeedbackPageSearch {
  if (search['type'] === FEEDBACK_BUG_SEARCH_TYPE || search['type'] === 'bug') {
    return { type: FEEDBACK_BUG_SEARCH_TYPE };
  }
  return {};
}

export function resolveFeedbackPageType(search: FeedbackPageSearch): FeedbackPageType {
  return search.type === FEEDBACK_BUG_SEARCH_TYPE ? 'bug' : 'general';
}

export function isFeedbackBugType(type: FeedbackPageType): boolean {
  return type === 'bug';
}

export function feedbackMailtoSubjectKey(type: FeedbackPageType): MessageKey {
  return type === 'bug'
    ? ('feedback.page.mailtoSubjectBug' as MessageKey)
    : ('feedback.page.mailtoSubject' as MessageKey);
}

export function buildFeedbackMailtoHref(subject: string): string {
  return buildSupportMailtoHref(subject);
}

export function assertFeedbackContractSync(): void {
  if (FEEDBACK_ROUTE !== '/feedback') {
    throw new Error('feedback: route drift');
  }
  if (SUPPORT_CONTACT_EMAIL.length < 3) {
    throw new Error('feedback: contact email drift');
  }
  if (FEEDBACK_FAQ_CTA_ROUTE !== '/support/faq') {
    throw new Error('feedback: FAQ CTA drift');
  }
}
