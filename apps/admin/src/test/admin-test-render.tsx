import { createElement, type ReactElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  render as rtlRender,
  type RenderOptions,
  type RenderResult,
} from '@testing-library/react';

function AdminTestProviders({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return createElement(QueryClientProvider, { client }, children);
}

export function renderAdmin(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
): RenderResult {
  return rtlRender(ui, { wrapper: AdminTestProviders, ...options });
}
