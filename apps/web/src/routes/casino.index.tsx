import { createFileRoute } from '@tanstack/react-router';

import { CasinoLobbyPage } from '@/product/surfaces/casino/casino-lobby-page';

export const Route = createFileRoute('/casino/')({
  component: CasinoIndexRoutePage,
});

function CasinoIndexRoutePage() {
  return <CasinoLobbyPage />;
}
