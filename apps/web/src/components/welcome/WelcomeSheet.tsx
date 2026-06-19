import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Sparkles, X } from "lucide-react";
import { t } from "@/i18n";

const STORAGE_KEY = "phonara.welcomed";

export type WelcomeSheetProps = {
  /** Controlled open (e.g. dashboard controller). Omit for auto localStorage gate on /home. */
  open?: boolean;
  onDismiss?: () => void;
};

export function WelcomeSheet({ open: controlledOpen, onDismiss }: WelcomeSheetProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isControlled) return;
    try {
      const seen = window.localStorage.getItem(STORAGE_KEY);
      if (!seen) setInternalOpen(true);
    } catch {
      // ignore (Safari private mode)
    }
  }, [isControlled]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open]);

  const close = () => {
    if (!isControlled) {
      try {
        window.localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // ignore
      }
      setInternalOpen(false);
    }
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label={t("welcome.aria.close-overlay")}
            onClick={close}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-title"
            tabIndex={-1}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="relative mx-3 mb-3 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card-hover)] sm:mb-0 focus:outline-none"
          >
            <button
              type="button"
              onClick={close}
              aria-label={t("common.close")}
              className="absolute right-3 top-3 grid size-10 place-items-center rounded-md text-muted-foreground hover:bg-(--color-surface-elev) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
            >
              <X className="size-4" />
            </button>

            <div
              className="absolute inset-x-0 -top-12 h-32 opacity-60"
              style={{ background: "var(--gradient-aurora)", filter: "blur(40px)" }}
              aria-hidden
            />

            <div className="relative">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-(--color-primary)/15 px-2.5 py-1 text-[11px] font-medium text-(--color-primary)">
                <Sparkles className="size-3" /> {t("welcome.badge")}
              </div>
              <h2
                id="welcome-title"
                className="mt-3 text-2xl font-semibold tracking-tight"
              >
                {t("welcome.title")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("welcome.desc")}
              </p>

              <ul className="mt-4 grid gap-2 text-sm">
                <li className="flex items-center gap-2 rounded-lg border border-border bg-(--color-surface) px-3 py-2">
                  <Gift className="size-4 text-(--color-primary)" aria-hidden />
                  <span className="flex-1">{t("welcome.item.signup")}</span>
                  <span className="text-(--color-gold)">+5,000P</span>
                </li>
                <li className="flex items-center gap-2 rounded-lg border border-border bg-(--color-surface) px-3 py-2">
                  <Sparkles className="size-4 text-(--color-gold)" aria-hidden />
                  <span className="flex-1">{t("welcome.item.streak")}</span>
                  <span className="text-(--color-gold)">+10,500P</span>
                </li>
              </ul>

              <button
                type="button"
                onClick={close}
                className="mt-5 flex min-h-12 w-full items-center justify-center rounded-lg text-sm font-semibold text-(--color-primary-foreground) shadow-[var(--shadow-glow-cta)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
                style={{ backgroundImage: "var(--gradient-cta)" }}
              >
                {t("welcome.cta")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
