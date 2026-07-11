import { describe, expect, it } from 'vitest';

import {
  parseSupportTicketCreate,
  parseSupportTicketList,
  SUPPORT_TICKET_CATEGORIES,
} from '../support-ticket-display-contract';

describe('support-ticket-display-contract', () => {
  it('parses ticket list rows from RPC JSON', () => {
    const rows = parseSupportTicketList({
      ok: true,
      tickets: [
        {
          id: '11111111-1111-1111-1111-111111111111',
          category: 'wallet',
          subject: 'Withdrawal question',
          status: 'open',
          created_at: '2026-07-12T00:00:00Z',
          updated_at: '2026-07-12T00:00:00Z',
        },
      ],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.category).toBe('wallet');
    expect(SUPPORT_TICKET_CATEGORIES).toContain('wallet');
  });

  it('parses create result', () => {
    const created = parseSupportTicketCreate({
      ok: true,
      ticket_id: '22222222-2222-2222-2222-222222222222',
      status: 'open',
    });

    expect(created?.ticketId).toBe('22222222-2222-2222-2222-222222222222');
    expect(created?.idempotent).toBe(false);
  });
});
