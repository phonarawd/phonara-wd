import { describe, expect, it } from 'vitest';

import { messages, type MessageKey } from '@phonara/i18n';

import {
  PLATFORM_EWAVE_HIDDEN_ROUTES,
  PLATFORM_NARRATIVE_KEY_PREFIXES,
  PLATFORM_PILLAR_IDS,
  PLATFORM_PILLAR_ROUTES,
  PLATFORM_POSITIONING_KEY_PREFIX,
  listPlatformNarrativeMessageKeys,
} from '../platform-narrative-display-contract';

describe('platform-narrative-display-contract §3.5', () => {
  it('defines three platform pillars with canonical routes', () => {
    expect(PLATFORM_PILLAR_IDS).toEqual(['earn', 'wallet', 'play']);
    expect(PLATFORM_PILLAR_ROUTES.earn).toBe('/home');
    expect(PLATFORM_PILLAR_ROUTES.wallet).toBe('/wallet');
  });

  it('lists E-Wave routes as hidden until engine gates', () => {
    expect(PLATFORM_EWAVE_HIDDEN_ROUTES).not.toContain('/wallet/transfer');
    expect(PLATFORM_EWAVE_HIDDEN_ROUTES).not.toContain('/settings/api-keys');
    expect(PLATFORM_EWAVE_HIDDEN_ROUTES).toContain('/status');
  });

  it('exports narrative i18n key prefixes for platform canon', () => {
    expect(PLATFORM_NARRATIVE_KEY_PREFIXES).toContain(PLATFORM_POSITIONING_KEY_PREFIX);
    expect(PLATFORM_NARRATIVE_KEY_PREFIXES.length).toBeGreaterThanOrEqual(5);
  });

  it('registers ko+en i18n keys for platform positioning and pillars', () => {
    for (const key of listPlatformNarrativeMessageKeys()) {
      expect(messages.ko[key as MessageKey], `missing ko: ${key}`).toBeTruthy();
      expect(messages.en[key as MessageKey], `missing en: ${key}`).toBeTruthy();
    }
  });
});
