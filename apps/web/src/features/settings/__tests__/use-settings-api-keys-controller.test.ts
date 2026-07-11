import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';

import { describe, expect, it, vi } from 'vitest';

import { useSettingsApiKeysController } from '@/features/settings/use-settings-api-keys-controller';

vi.mock('@/product/i18n', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ session: { user: { id: 'u1' } }, loading: false }),
}));

vi.mock('@/domain/trading-api-keys', () => ({
  listTradingApiKeys: vi.fn(async () => []),
  createTradingApiKey: vi.fn(),
  revokeTradingApiKey: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return createElement(QueryClientProvider, { client }, children);
}

describe('useSettingsApiKeysController', () => {
  it('exposes live manage capability after E10 unlock', async () => {
    const { result } = renderHook(() => useSettingsApiKeysController(), { wrapper });

    expect(result.current.route).toBe('/settings/api-keys');
    expect(result.current.pageExposure).toBe('live');
    expect(result.current.hubExposure).toBe('live');
    expect(result.current.canManageKeys).toBe(true);
    await waitFor(() => {
      expect(result.current.keysLoading).toBe(false);
    });
  });
});
