import { createElement, type ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import { parseSupportTicketList } from '@/domain/support-ticket-display-contract';
import { useSupportTicketController } from '@/features/support/use-support-ticket-controller';

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ session: { user: { id: 'user-1' } } }),
}));

vi.mock('@/lib/rpc', () => ({
  callRpc: vi.fn(async (name: string) => {
    if (name === 'rpc_list_support_tickets') {
      return {
        ok: true,
        tickets: [
          {
            id: '11111111-1111-1111-1111-111111111111',
            category: 'wallet',
            subject: 'Help',
            status: 'open',
            created_at: '2026-07-12T00:00:00Z',
            updated_at: '2026-07-12T00:00:00Z',
          },
        ],
      };
    }
    return { ok: true };
  }),
}));

vi.mock('@/product/i18n', () => ({
  useT: () => (key: string) => key,
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client }, children);
}

describe('use-support-ticket-controller', () => {
  it('parses support ticket list from RPC', () => {
    const rows = parseSupportTicketList({
      ok: true,
      tickets: [
        {
          id: '11111111-1111-1111-1111-111111111111',
          category: 'wallet',
          subject: 'Help',
          status: 'open',
          created_at: '2026-07-12T00:00:00Z',
          updated_at: '2026-07-12T00:00:00Z',
        },
      ],
    });
    expect(rows).toHaveLength(1);
  });

  it('exposes live controller defaults', async () => {
    const { result } = renderHook(() => useSupportTicketController(), { wrapper });
    expect(result.current.live).toBe(true);
    expect(result.current.categories.length).toBeGreaterThan(0);
  });
});
