import { createFileRoute } from '@tanstack/react-router';

import { FeesPage } from '@/product/surfaces/marketing/fees-page';

export const Route = createFileRoute('/fees')({
  component: FeesPage,
});
