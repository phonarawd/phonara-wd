import { createFileRoute } from '@tanstack/react-router';

import { FeaturesHubPage } from '@/product/surfaces/marketing/features-hub-page';

export const Route = createFileRoute('/features/')({
  component: FeaturesHubPage,
});
