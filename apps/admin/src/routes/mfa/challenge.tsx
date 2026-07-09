import { createFileRoute } from '@tanstack/react-router';

import { AdminMfaChallengePage } from '@/product/surfaces/admin-mfa-challenge-page';

export const Route = createFileRoute('/mfa/challenge')({
  component: AdminMfaChallengePage,
});
