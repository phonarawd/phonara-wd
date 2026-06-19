import { useEffect, useState } from "react";
import { t } from "@/i18n";

// §P11-C PWA Supremacy — online/offline thin sticky bar (shell only, display-only).
// No SW · no fetch interceptor · no cache.
export function OfflineIndicator() {
  const [online, setOnline] = useState<boolean>(true);

  useEffect(() => {
    // Initial state (client-only).
    if (typeof navigator !== "undefined" && "onLine" in navigator) {
      setOnline(navigator.onLine);
    }
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 bg-destructive px-4 py-1.5 text-xs font-medium text-destructive-foreground shadow"
    >
      <span aria-hidden="true">●</span>
      <span>{t("pwa.offline.title")}</span>
      <span className="hidden sm:inline opacity-80">
        · {t("pwa.offline.hint")}
      </span>
      <button
        type="button"
        onClick={() => {
          if (typeof window !== "undefined") window.location.reload();
        }}
        className="ml-2 rounded border border-destructive-foreground/40 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide hover:bg-destructive-foreground/10"
      >
        {t("pwa.offline.retry")}
      </button>
    </div>
  );
}
