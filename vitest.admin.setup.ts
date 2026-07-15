import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeAll, beforeEach } from 'vitest';
import { createElement, type ReactNode } from 'react';

import { preloadAllLocalesForTests } from '@phonara/i18n';

/** R9-PERF-JS / Phase 4 — preload en for sync I18nProvider in admin tests. */
beforeAll(async () => {
  await preloadAllLocalesForTests();
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
