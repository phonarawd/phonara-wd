import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { AccountSettingsPage } from '@/product/surfaces/settings/account-settings-page';

export const Route = createFileRoute('/settings/account')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: AccountSettingsPage,
});
