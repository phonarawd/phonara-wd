import { useEffect } from 'react';

import { registerSW } from 'virtual:pwa-register';

import { InstallPromptProvider } from '@/features/pwa/install-prompt-context';
import { notifyPwaSwUpdateReady } from '@/features/pwa/pwa-sw-update';

import { PwaInstallBanner } from './pwa-install-banner';

function PwaSwRegister() {
  useEffect(() => {
    if (!import.meta.env.PROD) return;

    const applyUpdate = registerSW({
      onNeedRefresh() {
        notifyPwaSwUpdateReady(() => {
          void applyUpdate(true);
        });
      },
    });
  }, []);

  return null;
}

/** SW registration + deferred install prompt (§25.10). */
export function PwaShell() {
  return (
    <InstallPromptProvider>
      <PwaSwRegister />
      <PwaInstallBanner />
    </InstallPromptProvider>
  );
}
