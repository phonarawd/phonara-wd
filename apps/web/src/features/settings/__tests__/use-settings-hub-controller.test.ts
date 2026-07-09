import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSettingsHubController } from '@/features/settings/use-settings-hub-controller';

const productToastShowMock = vi.hoisted(() => vi.fn());

vi.mock('@/product/i18n', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('@/product/primitives/toast-zone', () => ({
  productToast: { show: productToastShowMock },
}));

describe('useSettingsHubController', () => {
  beforeEach(() => {
    productToastShowMock.mockReset();
    window.localStorage.clear();
    window.localStorage.setItem('phonara.locale', 'ko');
  });

  it('groups nav items and exposes notification prefs', () => {
    const { result } = renderHook(() => useSettingsHubController());

    expect(result.current.navByGroup.account.some((item) => item.id === 'security')).toBe(true);
    expect(result.current.navByGroup.alerts.some((item) => item.id === 'notifications-prefs')).toBe(
      true,
    );
    expect(result.current.notificationPrefs.deposit).toBe(true);
    expect(result.current.casinoConfirm).toBe(false);
  });

  it('writes notification pref and shows warm toast', () => {
    const { result } = renderHook(() => useSettingsHubController());

    act(() => {
      result.current.setNotificationPref('marketing', false);
    });

    expect(result.current.notificationPrefs.marketing).toBe(false);
    expect(window.localStorage.getItem('phonara.settings.notifications.marketing')).toBe('0');
    expect(productToastShowMock).toHaveBeenCalledWith({
      zone: 'warm',
      key: 'settings.notifications.toast.marketing.off',
    });
  });

  it('writes casino confirm pref and shows toast', () => {
    const { result } = renderHook(() => useSettingsHubController());

    act(() => {
      result.current.setCasinoConfirm(true);
    });

    expect(result.current.casinoConfirm).toBe(true);
    expect(window.localStorage.getItem('phonara.settings.casino.confirmDialog')).toBe('1');
    expect(productToastShowMock).toHaveBeenCalledWith({
      zone: 'warm',
      key: 'settings.casino.toast.confirmOn',
    });
  });

  it('writes trade one-click pref and clears confirm dialog', () => {
    const { result } = renderHook(() => useSettingsHubController());

    act(() => {
      result.current.setTradeOneClick(true);
    });

    expect(result.current.tradeOneClick).toBe(true);
    expect(result.current.tradeConfirm).toBe(false);
    expect(window.localStorage.getItem('phonara.settings.trade.oneClick')).toBe('1');
    expect(window.localStorage.getItem('phonara.settings.trade.confirmDialog')).toBe('0');
    expect(productToastShowMock).toHaveBeenCalledWith({
      zone: 'warm',
      key: 'settings.trade.toast.oneClickOn',
    });
  });

  it('writes trade confirm pref and clears one-click', () => {
    const { result } = renderHook(() => useSettingsHubController());

    act(() => {
      result.current.setTradeConfirm(false);
    });

    expect(result.current.tradeConfirm).toBe(false);
    expect(window.localStorage.getItem('phonara.settings.trade.confirmDialog')).toBe('0');
    expect(productToastShowMock).toHaveBeenCalledWith({
      zone: 'warm',
      key: 'settings.trade.toast.confirmOff',
    });
  });
});
