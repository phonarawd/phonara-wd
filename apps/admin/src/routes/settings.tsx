import { createFileRoute } from '@tanstack/react-router';

import { AdminSettingsPage } from '@/product/surfaces/admin-settings-page';

export const Route = createFileRoute('/settings')({
  component: AdminSettingsPage,
});
