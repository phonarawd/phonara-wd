import { useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { toast } from 'sonner';
import { Button, Card, Icon } from '@phonara/ui';
import { useT } from '../lib/i18n';
import { isStandalonePwa, PWA_INSTALL_DISMISS_KEY } from '../lib/pwa';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

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

  return <PwaInstallPrompt />;
}

function PwaInstallPrompt() {
  const t = useT();
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return window.localStorage.getItem(PWA_INSTALL_DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isStandalonePwa()) return;

    function onBeforeInstall(event: Event) {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  if (dismissed || !promptEvent || isStandalonePwa()) return null;

  async function handleInstall() {
    await promptEvent!.prompt();
    const { outcome } = await promptEvent!.userChoice;
    if (outcome === 'accepted') {
      setPromptEvent(null);
    }
  }

  function handleDismiss() {
    try {
      window.localStorage.setItem(PWA_INSTALL_DISMISS_KEY, '1');
    } catch {
      /* localStorage may be unavailable */
    }
    setDismissed(true);
    setPromptEvent(null);
  }

  return (
    <Card
      elevation="raised"
      className="pwa-install-card"
      data-testid="pwa-install-prompt"
    >
      <div className="flex items-start gap-3">
        <span className="pwa-install-icon" aria-hidden="true">
          <Icon name="plus" size="sm" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-fg">{t('pwa.install.title')}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">{t('pwa.install.description')}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="primary" size="sm" className="flex-1" data-testid="pwa-install-action" onClick={() => { void handleInstall(); }}>
          {t('pwa.install.action')}
        </Button>
        <Button variant="ghost" size="sm" data-testid="pwa-install-dismiss" onClick={handleDismiss}>
          {t('pwa.install.dismiss')}
        </Button>
      </div>
    </Card>
  );
}
