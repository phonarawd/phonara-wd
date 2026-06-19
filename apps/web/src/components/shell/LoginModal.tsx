import { useState, type FormEvent } from "react";
import { Link } from "@/shims/react-router-dom";
import { toast } from "sonner";
import { LogIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { t } from "@/i18n";
import type { useLoginPageController } from "@/features/auth/use-login-page-controller";

export interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  engine?: ReturnType<typeof useLoginPageController>;
  /** When true, render the form inline (no Radix dialog) — used on /login for E2E stability. */
  embedded?: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginModal({ open, onOpenChange, engine, embedded = false }: LoginModalProps) {
  const [mockEmail, setMockEmail] = useState("");
  const [mockPassword, setMockPassword] = useState("");

  const email = engine?.email ?? mockEmail;
  const password = engine?.password ?? mockPassword;
  const setEmail = engine?.setEmail ?? setMockEmail;
  const setPassword = engine?.setPassword ?? setMockPassword;
  const isBusy = engine?.isBusy ?? false;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    if (engine) {
      void engine.handlePasswordLogin(e);
      return;
    }
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      toast.error(t("shell.login.invalidEmail"));
      return;
    }
    if (password.length < 6) {
      toast.error(t("shell.login.shortPassword"));
      return;
    }
    toast.success(t("shell.login.success"));
    setMockEmail("");
    setMockPassword("");
    onOpenChange(false);
  };

  const handleGoogle = () => {
    toast(t("shell.login.googleSoon"));
  };

  const errorMessage = engine?.errorKey ? engine.t(engine.errorKey) : null;

  const body = (
    <>
      {embedded ? (
        <header className="text-left">
          <h2 className="text-lg font-semibold">{t("shell.login.title")}</h2>
          <p className="sr-only">{t("shell.login.title")}</p>
        </header>
      ) : (
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {t("shell.login.title")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("shell.login.title")}
          </DialogDescription>
        </DialogHeader>
      )}

      {engine?.magicSent ? (
        <p className="text-sm text-muted-foreground" role="status">
          {t("auth.entry.shared.magicLinkSentBody")}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-3">
          {errorMessage ? (
            <p className="text-xs text-(--color-destructive)" role="alert">
              {errorMessage}
            </p>
          ) : null}
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            {t("shell.login.email")}
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              disabled={isBusy}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-11 rounded-lg border border-border bg-(--color-surface-elev) px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            {t("shell.login.password")}
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              disabled={isBusy}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-11 rounded-lg border border-border bg-(--color-surface-elev) px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
            />
          </label>

          <button
            type="submit"
            disabled={isBusy}
            className="mt-2 flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-bold text-(--color-primary-foreground) transition active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring) disabled:opacity-60"
            style={{
              backgroundImage: "var(--gradient-cta)",
              boxShadow: "var(--shadow-glow-cta)",
            }}
          >
            <LogIn className="size-4" aria-hidden />
            {isBusy ? t("common.processing") : t("shell.login.submit")}
          </button>

          {engine ? (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => void engine.handleMagicLink()}
              className="flex min-h-11 items-center justify-center rounded-lg border border-border bg-(--color-surface-elev) text-sm text-foreground hover:bg-(--color-surface) disabled:opacity-60"
            >
              {t("auth.entry.shared.magicLinkSecondary")}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGoogle}
              className="flex min-h-11 items-center justify-center rounded-lg border border-border bg-(--color-surface-elev) text-sm text-foreground hover:bg-(--color-surface) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
            >
              {t("shell.login.google")}
            </button>
          )}

          <p id="login-terms" className="mt-1 text-center text-[11px] text-muted-foreground">
            {t("shell.login.terms")}
          </p>

          <div className="mt-1 text-center text-xs text-muted-foreground">
            {t("shell.login.signupHint")}{" "}
            <Link
              to="/signup"
              onClick={() => onOpenChange(false)}
              className="font-semibold text-(--color-primary) underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
            >
              {t("shell.login.signupCta")}
            </Link>
          </div>
        </form>
      )}
    </>
  );

  if (embedded) {
    return (
      <div className="w-full rounded-2xl border border-border bg-(--color-surface) p-6 text-left">
        {body}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm border-border bg-(--color-surface) p-6"
        aria-describedby="login-terms"
      >
        {body}
      </DialogContent>
    </Dialog>
  );
}
