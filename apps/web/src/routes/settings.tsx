import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { SettingsHubPage } from '@/product/surfaces/settings/settings-hub-page';

export const Route = createFileRoute('/settings')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: SettingsRoutePage,
});

function SettingsRoutePage() {
  return <SettingsHubPage />;
}
