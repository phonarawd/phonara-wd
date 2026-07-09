import { createFileRoute, redirect } from '@tanstack/react-router';

/** Operator alias `/rewards` → canonical `/earn/rewards` (§12.14). */
export const Route = createFileRoute('/rewards')({
  beforeLoad: () => {
    throw redirect({ to: '/earn/rewards' });
  },
});
