import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSettingsNotificationsController } from '@/features/settings/use-settings-notifications-controller';

const productToastShow = vi.hoisted(() => vi.fn());

vi.mock('@/product/i18n', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('@/product/primitives/toast-zone', () => ({
  productToast: {
    show: productToastShow,
  },
}));

describe('useSettingsNotificationsController', () => {
  beforeEach(() => {
    productToastShow.mockReset();
    window.localStorage.clear();
    window.localStorage.setItem('phonara.locale', 'ko');
  });

  it('groups visible notification prefs including tierDecayWarning after E1', () => {
    const { result } = renderHook(() => useSettingsNotificationsController());

    expect(result.current.prefsByGroup.money).toEqual(['deposit', 'priceAlert']);
    expect(result.current.prefsByGroup.growth).toEqual([
      'mission',
      'referral',
      'tierUpgrade',
      'tierDecayWarning',
    ]);
    expect(result.current.prefsByGroup.marketing).toEqual(['marketing']);
  });

  it('writes notification pref and shows warm toast', () => {
    const { result } = renderHook(() => useSettingsNotificationsController());

    act(() => {
      result.current.setNotificationPref('tierUpgrade', false);
    });

    expect(window.localStorage.getItem('phonara.settings.notifications.tierUpgrade')).toBe('0');
    expect(productToastShow).toHaveBeenCalledWith({
      zone: 'warm',
      key: 'settings.notifications.toast.tierUpgrade.off',
    });
  });
});
