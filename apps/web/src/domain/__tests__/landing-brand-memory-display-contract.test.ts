import { describe, expect, it } from 'vitest';

import {
  LANDING_BRAND_MEMORY_TEST_PROMPTS,
  LANDING_BRAND_MEMORY_TEST_VARIANTS,
  landingBrandMemoryPromptKey,
} from '../landing-brand-memory-display-contract';

describe('landing-brand-memory-display-contract', () => {
  it('defines recall test variants including geometric shape', () => {
    expect(LANDING_BRAND_MEMORY_TEST_VARIANTS).toContain('shape');
    expect(LANDING_BRAND_MEMORY_TEST_VARIANTS).toContain('flat');
  });

  it('maps prompt ids to i18n keys', () => {
    expect(LANDING_BRAND_MEMORY_TEST_PROMPTS).toContain('recall_shape');
    expect(landingBrandMemoryPromptKey('recall_wordmark')).toBe(
      'landing.brandMemory.prompt.recall_wordmark',
    );
  });
});
