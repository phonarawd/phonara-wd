import { createFileRoute } from '@tanstack/react-router';

import { SupportTicketStubPage } from '@/product/surfaces/marketing/support-ticket-stub-page';

export const Route = createFileRoute('/support/ticket')({
  component: SupportTicketStubPage,
});
