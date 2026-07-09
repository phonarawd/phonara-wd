import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';

import { PreferencesSettingsPage } from '@/product/surfaces/settings/preferences-settings-page';

export const Route = createFileRoute('/settings/preferences')({
  beforeLoad: async () => {
    const session = await getSession();

    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },

  component: PreferencesSettingsPage,
});
