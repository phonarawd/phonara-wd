import { describe, expect, it } from 'vitest';

import {
  LANDING_DESIGN_RELEASE_CHECKLIST,
  LANDING_DESIGN_RELEASE_VERSION,
} from '../landing-design-release-display-contract';

describe('landing-design-release-display-contract', () => {
  it('declares Design Release v1.0 checklist', () => {
    expect(LANDING_DESIGN_RELEASE_VERSION).toBe('1.0');
    expect(LANDING_DESIGN_RELEASE_CHECKLIST).toContain('analytics-funnel-contract');
    expect(LANDING_DESIGN_RELEASE_CHECKLIST).toContain('cvr-fold-modules');
  });
});
