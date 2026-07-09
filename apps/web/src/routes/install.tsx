import { createFileRoute } from '@tanstack/react-router';

import { InstallPage } from '@/product/surfaces/install/install-page';

export const Route = createFileRoute('/install')({
  component: InstallRoutePage,
});

function InstallRoutePage() {
  return <InstallPage />;
}
