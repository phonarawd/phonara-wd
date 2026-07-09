import { createFileRoute, redirect } from '@tanstack/react-router';

/** Operator alias `/config` → canonical `/settings` (§12.14). */
export const Route = createFileRoute('/config')({
  beforeLoad: () => {
    throw redirect({ to: '/settings' });
  },
});
