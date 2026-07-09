import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { NotificationsPage } from '@/product/surfaces/notifications/notifications-page';

export const Route = createFileRoute('/notifications')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: NotificationsRoutePage,
});

function NotificationsRoutePage() {
  return <NotificationsPage />;
}
