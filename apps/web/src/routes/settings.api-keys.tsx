import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';

import { ApiKeysSettingsPage } from '@/product/surfaces/settings/api-keys-settings-page';

export const Route = createFileRoute('/settings/api-keys')({
  beforeLoad: async () => {
    const session = await getSession();

    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },

  component: ApiKeysSettingsPage,
});
