import { describe, expect, it, beforeEach } from 'vitest';
import {
  BET_HUB_SECTION_STORAGE_KEY,
  buildBetHubSectionHref,
  isBetSection,
  parseBetHubSectionFromSearch,
  readBetHubSectionStorage,
  resolveBetHubSection,
  writeBetHubSectionStorage,
} from '../bet-hub-section';

describe('bet-hub-section', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('isBetSection accepts only casino/sports/trade', () => {
    expect(isBetSection('trade')).toBe(true);
    expect(isBetSection('sports')).toBe(true);
    expect(isBetSection('invalid')).toBe(false);
  });

  it('resolveBetHubSection prefers URL, then storage, then default', () => {
    expect(resolveBetHubSection('sports', 'casino', 'trade')).toBe('sports');
    expect(resolveBetHubSection(undefined, 'casino', 'trade')).toBe('casino');
    expect(resolveBetHubSection(undefined, null, 'trade')).toBe('trade');
  });

  it('persists section in localStorage', () => {
    writeBetHubSectionStorage('casino');
    expect(window.localStorage.getItem(BET_HUB_SECTION_STORAGE_KEY)).toBe('casino');
    expect(readBetHubSectionStorage()).toBe('casino');
  });

  it('parseBetHubSectionFromSearch and buildBetHubSectionHref round-trip', () => {
    expect(parseBetHubSectionFromSearch('?section=sports')).toBe('sports');
    expect(parseBetHubSectionFromSearch('?section=invalid')).toBeUndefined();
    expect(buildBetHubSectionHref('/trade', '', 'sports', 'trade')).toBe('/trade?section=sports');
    expect(buildBetHubSectionHref('/trade', '?section=sports', 'trade', 'trade')).toBe('/trade');
  });
});
