import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { isPwaStandalone } from './pwa-install';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type InstallPromptContextValue = {
  canPrompt: boolean;
  isInstalled: boolean;
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
};

const InstallPromptContext = createContext<InstallPromptContextValue | null>(null);

/** Captures `beforeinstallprompt` and defers native install until user action (§25.10). */
export function InstallPromptProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => isPwaStandalone());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncInstalled = () => setIsInstalled(isPwaStandalone());
    syncInstalled();

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    window.matchMedia('(display-mode: standalone)').addEventListener('change', syncInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', syncInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferredPrompt) return 'unavailable';
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
    return choice.outcome;
  }, [deferredPrompt]);

  const value = useMemo<InstallPromptContextValue>(
    () => ({
      canPrompt: deferredPrompt !== null,
      isInstalled,
      promptInstall,
    }),
    [deferredPrompt, isInstalled, promptInstall],
  );

  return <InstallPromptContext.Provider value={value}>{children}</InstallPromptContext.Provider>;
}

export function useInstallPrompt(): InstallPromptContextValue {
  const ctx = useContext(InstallPromptContext);
  if (!ctx) {
    throw new Error('useInstallPrompt must be used within InstallPromptProvider');
  }
  return ctx;
}
