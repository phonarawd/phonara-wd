import { createFileRoute } from '@tanstack/react-router';

import { SystemStatusStubPage } from '@/product/surfaces/marketing/system-status-stub-page';

export const Route = createFileRoute('/status')({
  component: SystemStatusStubPage,
});
