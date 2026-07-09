import { createFileRoute } from '@tanstack/react-router';

import { WalletPage } from '@/product/surfaces/wallet/wallet-page';

export const Route = createFileRoute('/wallet/')({
  component: WalletPage,
});
