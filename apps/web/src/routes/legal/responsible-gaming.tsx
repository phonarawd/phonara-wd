import { createFileRoute } from '@tanstack/react-router';

import { ResponsibleGamingPage } from '@/product/surfaces/legal/responsible-gaming-page';

export const Route = createFileRoute('/legal/responsible-gaming')({
  component: ResponsibleGamingPage,
});
