import { render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '@/product/i18n';
import { SupportTicketPage } from '@/product/surfaces/marketing/support-ticket-page';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/features/support/use-support-ticket-controller', () => ({
  useSupportTicketController: () => ({
    t: (key: string) => key,
    live: true,
    categories: ['account', 'wallet'],
    category: 'account',
    setCategory: vi.fn(),
    subject: 'Need help',
    setSubject: vi.fn(),
    body: 'Please review my account settings.',
    setBody: vi.fn(),
    confirmOpen: false,
    openConfirm: vi.fn(),
    closeConfirm: vi.fn(),
    submitting: false,
    submitErrorKey: null,
    submitSuccess: false,
    tickets: [
      {
        id: '11111111-1111-1111-1111-111111111111',
        category: 'account',
        subject: 'Prior ticket',
        status: 'open',
        createdAt: '2026-07-12T00:00:00Z',
        updatedAt: '2026-07-12T00:00:00Z',
      },
    ],
    ticketsLoading: false,
    submitTicket: vi.fn(),
    refreshTickets: vi.fn(),
  }),
}));

describe('SupportTicketPage', () => {
  it('renders E10 live ticket form and history', () => {
    render(
      <I18nProvider>
        <SupportTicketPage />
      </I18nProvider>,
    );

    expect(screen.getByTestId('support-ticket-page')).toBeInTheDocument();
    expect(screen.getByTestId('support-ticket-live')).toBeInTheDocument();
    expect(screen.getByTestId('support-ticket-form')).toBeInTheDocument();
    expect(screen.getByTestId('support-ticket-history-list')).toBeInTheDocument();
  });
});
