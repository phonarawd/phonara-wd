import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { ReferralSettingsPage } from '@/product/surfaces/settings/referral-settings-page';

export const Route = createFileRoute('/settings/referral')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: ReferralSettingsPage,
});
