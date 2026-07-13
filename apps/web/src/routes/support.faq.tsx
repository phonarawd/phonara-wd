import { createFileRoute } from '@tanstack/react-router';

import { SupportFaqPage } from '@/product/surfaces/marketing/support-faq-page';

export const Route = createFileRoute('/support/faq')({
  component: SupportFaqPage,
});
