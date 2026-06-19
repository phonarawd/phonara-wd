import { useState, type FormEvent } from "react";
import { Link } from "@/shims/react-router-dom";
import { KeyRound, MailCheck } from "lucide-react";
import { t } from "@/i18n";
import type { useResetPasswordPageController } from "@/features/auth/use-reset-password-page-controller";

export type ImportedResetPasswordPageProps = {
  engine?: ReturnType<typeof useResetPasswordPageController>;
};

export function ImportedResetPasswordPage({ engine }: ImportedResetPasswordPageProps) {
  const [localEmail, setLocalEmail] = useState("");
  const [localSent, setLocalSent] = useState(false);

  const email = engine?.email ?? localEmail;
  const setEmail = engine?.setEmail ?? setLocalEmail;
  const sent = engine?.sent ?? localSent;
  const busy = engine?.busy ?? false;
  const errorMessage = engine?.errorMessage ?? null;

  const submit = (e: FormEvent<HTMLFormElement>) => {
    if (engine) {
      void engine.submit(e);
      return;
    }
    e.preventDefault();
    setLocalSent(true);
  };

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-background px-4 py-12">
      <section className="auth-shell-frame grid w-full max-w-sm gap-4 text-center">
        {sent ? (
          <>
            <MailCheck className="mx-auto size-8 text-(--color-primary)" />
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("auth.reset.sentTitle")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("auth.reset.sentDesc")}
            </p>
          </>
        ) : (
          <>
            <KeyRound className="mx-auto size-7 text-(--color-primary)" />
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("auth.reset.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("auth.reset.subtitle")}
            </p>
            <form onSubmit={submit} className="grid gap-3 text-left">
              {errorMessage ? (
                <p className="text-sm text-(--color-destructive)" role="alert">
                  {errorMessage}
                </p>
              ) : null}
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                {t("auth.reset.email")}
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="min-h-11 rounded-lg border border-border bg-(--color-surface-elev) px-3 text-sm text-foreground"
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="mt-2 flex min-h-11 items-center justify-center rounded-lg text-sm font-bold text-(--color-primary-foreground) disabled:opacity-60"
                style={{
                  backgroundImage: "var(--gradient-cta)",
                  boxShadow: "var(--shadow-glow-cta)",
                }}
              >
                {busy ? t("common.processing") : t("auth.reset.submit")}
              </button>
            </form>
          </>
        )}
        <Link
          to="/login"
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          {t("auth.reset.back")}
        </Link>
      </section>
    </main>
  );
}
