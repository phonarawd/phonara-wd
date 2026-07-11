import { describe, expect, it } from 'vitest';

import {
  FEEDBACK_ROUTE,
  assertFeedbackContractSync,
  buildFeedbackMailtoHref,
  feedbackMailtoSubjectKey,
  isFeedbackBugType,
  parseFeedbackPageSearch,
} from '../feedback-display-contract';

describe('feedback-display-contract', () => {
  it('parses bug search and builds mailto', () => {
    expect(FEEDBACK_ROUTE).toBe('/feedback');
    expect(parseFeedbackPageSearch({ type: 'bug' })).toEqual({ type: 'bug' });
    expect(parseFeedbackPageSearch({})).toEqual({});
    expect(isFeedbackBugType('bug')).toBe(true);
    expect(feedbackMailtoSubjectKey('bug')).toBe('feedback.page.mailtoSubjectBug');
    expect(buildFeedbackMailtoHref('Bug')).toContain('mailto:support@phonara.net');
    expect(() => assertFeedbackContractSync()).not.toThrow();
  });
});
