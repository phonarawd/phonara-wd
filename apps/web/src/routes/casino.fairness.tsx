import { createFileRoute } from '@tanstack/react-router';

import { CasinoFairnessPage } from '@/product/surfaces/casino/casino-fairness-page';

export const Route = createFileRoute('/casino/fairness')({
  component: CasinoFairnessRoutePage,
});

function CasinoFairnessRoutePage() {
  return <CasinoFairnessPage />;
}
