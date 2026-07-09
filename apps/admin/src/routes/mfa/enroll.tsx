import { createFileRoute } from '@tanstack/react-router';

import { AdminMfaEnrollPage } from '@/product/surfaces/admin-mfa-enroll-page';

export const Route = createFileRoute('/mfa/enroll')({
  component: AdminMfaEnrollPage,
});
