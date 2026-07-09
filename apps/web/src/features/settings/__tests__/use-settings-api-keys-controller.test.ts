import { renderHook } from '@testing-library/react';

import { describe, expect, it, vi } from 'vitest';

import { useSettingsApiKeysController } from '@/features/settings/use-settings-api-keys-controller';

vi.mock('@/product/i18n', () => ({
  useT: () => (key: string) => key,
}));

describe('useSettingsApiKeysController', () => {
  it('exposes gap stub state without manage capability', () => {
    const { result } = renderHook(() => useSettingsApiKeysController());

    expect(result.current.route).toBe('/settings/api-keys');

    expect(result.current.pageExposure).toBe('live');

    expect(result.current.hubExposure).toBe('built_hidden');

    expect(result.current.canManageKeys).toBe(false);
  });
});
