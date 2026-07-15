import { createFileRoute } from '@tanstack/react-router';

import { AnnouncementsPage } from '@/product/surfaces/marketing/announcements-page';

export const Route = createFileRoute('/announcements')({
  component: AnnouncementsPage,
});
