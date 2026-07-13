import { createFileRoute } from '@tanstack/react-router';

import { FeaturesVipPage } from '@/product/surfaces/marketing/features-vip-page';

export const Route = createFileRoute('/features/vip')({
  component: FeaturesVipPage,
});
