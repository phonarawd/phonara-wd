import { createFileRoute } from '@tanstack/react-router';

import { PrivacyPage } from '@/product/surfaces/legal/privacy-page';

export const Route = createFileRoute('/legal/privacy')({
  component: PrivacyPage,
});
