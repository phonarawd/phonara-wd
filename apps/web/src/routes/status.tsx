import { createFileRoute } from '@tanstack/react-router';

import { SystemStatusPage } from '@/product/surfaces/marketing/system-status-page';

export const Route = createFileRoute('/status')({
  component: SystemStatusPage,
});
