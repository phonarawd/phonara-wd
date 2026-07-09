import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { SecuritySettingsPage } from '@/product/surfaces/settings/security-settings-page';

export const Route = createFileRoute('/settings/security')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: SecuritySettingsPage,
});
