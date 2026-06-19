import { useEffect } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { toast } from 'sonner';
import { useT } from '../lib/i18n';

/** SW registration only — install prompt listeners live in InstallPromptProvider (__root). */
export function PwaShell() {
  const t = useT();

  useEffect(() => {
    if (!import.meta.env.PROD) return;

    const updateSW = registerSW({
      onNeedRefresh() {
        toast.message(t('pwa.update.title'), {
          action: {
            label: t('pwa.update.action'),
            onClick: () => {
              void updateSW(true);
            },
          },
          duration: Infinity,
        });
      },
    });
  }, [t]);

  return null;
}
