import { Link, useLocation } from "@/shims/react-router-dom";
import { X } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { t } from "@/i18n";

// §P11-C PWA Supremacy ??dismissable install banner.
// Consumes InstallPromptProvider context only ??does NOT register listeners.
// Mounts in AppShell.tsx (admin shells excluded; verified §GREEN G+ admin 격리).
export function PwaInstallBanner() {
  const { canInstall, isInstalled, isDismissed, platform, dismissBanner } =
    useInstallPrompt();
  const location = useLocation();

  // Hide on /install itself (no recursion) and once installed/dismissed.
  if (isInstalled || isDismissed) return null;
  if (location.pathname === "/install") return null;

  // Show when native prompt available (Android/desktop) OR on iOS Safari where
  // beforeinstallprompt never fires but Add-to-Home-Screen is supported.
  const showForIos = platform === "ios";
  if (!canInstall && !showForIos) return null;

  return (
    <div
      role="region"
      aria-label={t("pwa.banner.title")}
      data-testid="pwa-install-prompt"
      className="fixed inset-x-2 bottom-[calc(env(safe-area-inset-bottom)+72px)] z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl border border-border/60 bg-card/95 px-3 py-2.5 shadow-lg backdrop-blur md:bottom-4"
    >
      <div className="flex-1 text-xs text-foreground">
        <div className="font-semibold">{t("pwa.banner.title")}</div>
      </div>
      <Link
        to="/install"
        data-testid="pwa-install-action"
        className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
      >
        {t("pwa.banner.cta")}
      </Link>
      <button
        type="button"
        onClick={dismissBanner}
        data-testid="pwa-install-dismiss"
        aria-label={t("pwa.banner.dismiss")}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
