import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, vi } from 'vitest';
import { createElement, type ReactNode } from 'react';

/** Unit/component tests keep mock SOT; production routes use wired hooks. */
vi.mock('@/hooks/admin/useAdminWalletDesk', async () => {
  const mock = await import('@/hooks/admin/useAdminWalletDeskMock');
  return {
    ...mock,
    useAdminWalletDesk: mock.useAdminWalletDeskMock,
  };
});

vi.mock('@/hooks/admin/useAdminOperations', async () => {
  const mock = await import('@/hooks/admin/useAdminOperationsMock');
  return {
    ...mock,
    useAdminOperations: () => ({
      ...mock.useAdminOperationsMock(),
      configReady: true,
    }),
  };
});

vi.mock('@/hooks/admin/useAdminCompliance', async () => {
  const mock = await import('@/hooks/admin/useAdminComplianceMock');
  return {
    ...mock,
    useAdminCompliance: mock.useAdminComplianceMock,
  };
});

vi.mock('@/hooks/admin/useAdminAuditAlerts', async () => {
  const mock = await import('@/hooks/admin/useAdminAuditAlertsMock');
  return {
    ...mock,
    useAdminAuditAlerts: mock.useAdminAuditAlertsMock,
  };
});

vi.mock('@/hooks/admin/useAdminSports', async () => {
  const mock = await import('@/hooks/useAdminSportsMock');
  const time = await import('@/lib/admin-time');
  return {
    ...mock,
    useAdminSports: mock.useAdminSportsMock,
    formatKrwGrouped: time.formatKrwGrouped,
  };
});

vi.mock('@/hooks/admin/useAdminEarnDesk', async () => {
  const mock = await import('@/hooks/admin/useAdminEarnDeskMock');
  return {
    ...mock,
    useAdminEarnDesk: mock.useAdminEarnDeskMock,
  };
});

let queryClient: QueryClient;

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
});

afterEach(() => {
  cleanup();
});

configure({
  wrapper: ({ children }: { children: ReactNode }) => {
    const client =
      queryClient ??
      new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });
    return createElement(QueryClientProvider, { client }, children);
  },
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
