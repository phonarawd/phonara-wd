import { createFileRoute } from '@tanstack/react-router';

import { FeaturesEarnPage } from '@/product/surfaces/marketing/features-earn-page';

export const Route = createFileRoute('/features/earn')({
  component: FeaturesEarnPage,
});
