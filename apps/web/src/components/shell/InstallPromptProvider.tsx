import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// §P11-C PWA Supremacy — single mount host for beforeinstallprompt + appinstalled.
// This is the ONLY file in the codebase allowed to call
// addEventListener('beforeinstallprompt' | 'appinstalled') — enforced by §GREEN self-check.

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export type InstallPlatform = "ios" | "android" | "desktop" | "unknown";

export interface InstallPromptContextValue {
  /** Native beforeinstallprompt captured and ready to fire. */
  canInstall: boolean;
  /** App is already installed (appinstalled fired OR display-mode: standalone). */
  isInstalled: boolean;
  /** User dismissed the soft banner — persisted in localStorage. */
  isDismissed: boolean;
  /** Coarse platform sniff for install copy/CTA selection. */
  platform: InstallPlatform;
  /** Trigger the captured native prompt. Returns user outcome or "unavailable". */
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
  /** Mark the soft install banner dismissed (persists). */
  dismissBanner: () => void;
}

const DISMISS_KEY = "pwa.install.dismissed";

const defaultValue: InstallPromptContextValue = {
  canInstall: false,
  isInstalled: false,
  isDismissed: false,
  platform: "unknown",
  promptInstall: async () => "unavailable",
  dismissBanner: () => {},
};

export const InstallPromptContext =
  createContext<InstallPromptContextValue>(defaultValue);

function detectPlatform(): InstallPlatform {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  // iOS Safari uses navigator.standalone; others use display-mode media query.
  const iosStandalone =
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  const mqStandalone =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches;
  return iosStandalone || mqStandalone;
}

export function InstallPromptProvider({ children }: { children: ReactNode }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [platform, setPlatform] = useState<InstallPlatform>("unknown");

  useEffect(() => {
    // Client-only init.
    setPlatform(detectPlatform());
    setIsInstalled(detectStandalone());
    try {
      setIsDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      // localStorage unavailable — treat as not dismissed.
    }

    const onBeforeInstallPrompt = (event: Event) => {
      // §LOCK Footer 10 — Provider owns preventDefault + deferred state.
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return "unavailable" as const;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      setDeferred(null);
      if (choice.outcome === "accepted") setIsInstalled(true);
      return choice.outcome;
    } catch {
      return "unavailable" as const;
    }
  }, [deferred]);

  const dismissBanner = useCallback(() => {
    setIsDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo<InstallPromptContextValue>(
    () => ({
      canInstall: deferred !== null,
      isInstalled,
      isDismissed,
      platform,
      promptInstall,
      dismissBanner,
    }),
    [deferred, isInstalled, isDismissed, platform, promptInstall, dismissBanner],
  );

  return (
    <InstallPromptContext.Provider value={value}>
      {children}
    </InstallPromptContext.Provider>
  );
}
