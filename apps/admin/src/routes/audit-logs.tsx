import { createFileRoute, redirect } from '@tanstack/react-router';

/** Operator alias `/audit-logs` → canonical `/audit` (§12.14). */
export const Route = createFileRoute('/audit-logs')({
  beforeLoad: () => {
    throw redirect({ to: '/audit' });
  },
});
