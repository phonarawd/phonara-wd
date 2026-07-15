import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { SupportTicketPage } from '@/product/surfaces/marketing/support-ticket-page';

export const Route = createFileRoute('/support/ticket')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: SupportTicketPage,
});
