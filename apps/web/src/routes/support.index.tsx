import { createFileRoute } from '@tanstack/react-router';

import { SupportHubPage } from '@/product/surfaces/marketing/support-hub-page';

export const Route = createFileRoute('/support/')({
  component: SupportHubPage,
});
