import { createFileRoute, redirect } from '@tanstack/react-router';

import { casinoGameCodeFromSlug } from '@/domain/casino-outcome-replay-contract';
import { getSession } from '@/lib/auth';
import { CasinoGameShell } from '@/product/surfaces/games/casino-game-shell';

export const Route = createFileRoute('/games/$gameCode')({
  beforeLoad: async ({ params }) => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: '/login', replace: true });
    }
    const code = casinoGameCodeFromSlug(params.gameCode);
    if (!code) {
      throw redirect({ to: '/casino', replace: true });
    }
  },
  component: CasinoGameRoutePage,
});

function CasinoGameRoutePage() {
  const { gameCode: slug } = Route.useParams();
  const code = casinoGameCodeFromSlug(slug);
  if (!code) return null;
  return <CasinoGameShell gameCode={code} />;
}
