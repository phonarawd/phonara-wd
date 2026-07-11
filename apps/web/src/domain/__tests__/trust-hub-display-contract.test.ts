import { describe, expect, it } from 'vitest';

import { messages, type MessageKey } from '@phonara/i18n';

import {
  assertTrustHubContractSync,
  isTrustHubStatusDeferred,
  listTrustHubMessageKeys,
  TRUST_HUB_BLOCKS,
  TRUST_HUB_ROUTE,
} from '../trust-hub-display-contract';

describe('trust-hub-display-contract', () => {
  it('binds /security trust blocks with deferred status', () => {
    expect(TRUST_HUB_ROUTE).toBe('/security');
    expect(TRUST_HUB_BLOCKS).toHaveLength(5);
    expect(isTrustHubStatusDeferred()).toBe(true);
    expect(() => assertTrustHubContractSync()).not.toThrow();
  });

  it('registers ko+en trust hub message keys', () => {
    for (const key of listTrustHubMessageKeys()) {
      expect(messages.ko[key as MessageKey], `missing ko: ${key}`).toBeTruthy();
      expect(messages.en[key as MessageKey], `missing en: ${key}`).toBeTruthy();
    }
  });
});
