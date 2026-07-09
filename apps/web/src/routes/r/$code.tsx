import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/r/$code')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/signup',
      search: { referral_code: params.code },
      replace: true,
    });
  },
});
