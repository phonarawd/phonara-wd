import { describe, expect, it, vi, beforeEach } from 'vitest';

import { APP_INSTALL_RECORD_RPC } from '@/domain/app-install-mission-display-contract';

const callRpcMock = vi.hoisted(() => vi.fn());
const invalidateQueriesMock = vi.hoisted(() => vi.fn());
const promptInstallMock = vi.hoisted(() => vi.fn());
const productToastMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/rpc', () => ({
  callRpc: callRpcMock,
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: invalidateQueriesMock }),
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ session: { user: { id: 'user-1' } } }),
}));

vi.mock('@/features/pwa/install-prompt-context', () => ({
  useInstallPrompt: () => ({
    canPrompt: true,
    isInstalled: false,
    promptInstall: promptInstallMock,
  }),
}));

vi.mock('@/features/pwa/pwa-install', () => ({
  isPwaStandalone: () => false,
  detectPwaInstallPlatform: () => 'android',
}));

vi.mock('@/product/primitives/toast-zone', () => ({
  productToast: { show: productToastMock },
}));

import { useAppInstallMissionAction } from '@/features/earn/use-app-install-mission-action';
import { renderHook, act } from '@testing-library/react';

describe('useAppInstallMissionAction', () => {
  beforeEach(() => {
    callRpcMock.mockReset();
    invalidateQueriesMock.mockReset();
    promptInstallMock.mockReset();
    productToastMock.mockReset();
    promptInstallMock.mockResolvedValue('accepted');
    callRpcMock.mockResolvedValue({
      ok: true,
      granted: true,
      idempotent: false,
      attribution_id: 'attr-1',
    });
  });

  it('prompts install then records attribution', async () => {
    const { result } = renderHook(() => useAppInstallMissionAction());

    await act(async () => {
      await result.current.recordOrInstall();
    });

    expect(promptInstallMock).toHaveBeenCalled();
    expect(callRpcMock).toHaveBeenCalledWith(
      APP_INSTALL_RECORD_RPC,
      expect.objectContaining({ p_platform: 'android' }),
    );
    expect(productToastMock).toHaveBeenCalled();
  });
});
