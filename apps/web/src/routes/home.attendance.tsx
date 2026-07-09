import { createFileRoute, redirect } from '@tanstack/react-router';

import { getSession } from '@/lib/auth';
import { HomeAttendancePage } from '@/product/surfaces/home/home-attendance-page';

export const Route = createFileRoute('/home/attendance')({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
  },
  component: HomeAttendancePage,
});
