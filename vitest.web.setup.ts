import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { createElement, type ReactNode } from 'react';

import { preloadAllLocalesForTests } from '@phonara/i18n';

/** R9-PERF-JS / Phase 4 — en catalog is lazy in production; preload for sync I18nProvider tests. */
beforeAll(async () => {
  await preloadAllLocalesForTests();
});

/** Unit tests: allow-all RG gate without Supabase snapshot queries. */
vi.mock('@/features/responsible-gaming/use-rg-gate-policy', () => ({
  useRgGatePolicy: () => async () => null,
}));

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
