import { beforeEach, describe, expect, it, vi } from 'vitest';

const productToastShowMock = vi.hoisted(() => vi.fn());
const productToastDismissMock = vi.hoisted(() => vi.fn());

vi.mock('@/product/primitives/toast-zone', () => ({
  productToast: {
    show: productToastShowMock,
    dismiss: productToastDismissMock,
  },
}));

import {
  flushDeferredPwaSwUpdateToast,
  hasPendingPwaSwUpdate,
  notifyPwaSwUpdateReady,
  PWA_SW_UPDATE_ACTION_KEY,
  PWA_SW_UPDATE_TOAST_KEY,
  resetPwaSwUpdateStateForTests,
  setPwaSwUpdateToastDeferred,
} from '../pwa-sw-update';

describe('pwa-sw-update', () => {
  beforeEach(() => {
    resetPwaSwUpdateStateForTests();
    productToastShowMock.mockReset();
    productToastDismissMock.mockReset();
  });

  it('shows a single strict productToast for SW updates (§3.4)', () => {
    const applyUpdate = vi.fn();
    notifyPwaSwUpdateReady(applyUpdate);

    expect(productToastShowMock).toHaveBeenCalledTimes(1);
    expect(productToastShowMock).toHaveBeenCalledWith({
      zone: 'strict',
      key: PWA_SW_UPDATE_TOAST_KEY,
      action: {
        labelKey: PWA_SW_UPDATE_ACTION_KEY,
        onClick: expect.any(Function),
      },
    });
    expect(hasPendingPwaSwUpdate()).toBe(true);
  });

  it('dedupes repeated onNeedRefresh callbacks', () => {
    notifyPwaSwUpdateReady(vi.fn());
    notifyPwaSwUpdateReady(vi.fn());

    expect(productToastShowMock).toHaveBeenCalledTimes(1);
  });

  it('defers toast while critical session UI is active', () => {
    const applyUpdate = vi.fn();
    setPwaSwUpdateToastDeferred(true);

    notifyPwaSwUpdateReady(applyUpdate);
    expect(productToastShowMock).not.toHaveBeenCalled();
    expect(hasPendingPwaSwUpdate()).toBe(true);

    setPwaSwUpdateToastDeferred(false);
    expect(productToastShowMock).toHaveBeenCalledTimes(1);

    const action = productToastShowMock.mock.calls[0]?.[0]?.action;
    action?.onClick();
    expect(applyUpdate).toHaveBeenCalledTimes(1);
    expect(productToastDismissMock).toHaveBeenCalled();
  });

  it('flushes a queued update when defer clears', () => {
    const applyUpdate = vi.fn();
    setPwaSwUpdateToastDeferred(true);
    notifyPwaSwUpdateReady(applyUpdate);

    flushDeferredPwaSwUpdateToast();
    expect(productToastShowMock).not.toHaveBeenCalled();

    setPwaSwUpdateToastDeferred(false);
    flushDeferredPwaSwUpdateToast();
    expect(productToastShowMock).toHaveBeenCalledTimes(1);
  });
});
