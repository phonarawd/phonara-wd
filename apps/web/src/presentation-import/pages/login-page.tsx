import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LoginModal } from "@/components/shell/LoginModal";
import { t } from "@/i18n";
import type { useLoginPageController } from "@/features/auth/use-login-page-controller";

export type ImportedLoginPageProps = {
  engine?: ReturnType<typeof useLoginPageController>;
};

export function ImportedLoginPage({ engine }: ImportedLoginPageProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-background px-4 py-12">
      <section className="auth-shell-frame grid w-full max-w-sm gap-4 text-center">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("auth.login.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("auth.login.subtitle")}
          </p>
        </header>
        <LoginModal
          open={open}
          embedded
          engine={engine}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) navigate({ to: "/" });
          }}
        />
        <div className="text-xs text-muted-foreground">
          <Link to="/reset-password" className="underline-offset-4 hover:underline">
            {t("auth.login.forgot")}
          </Link>
        </div>
        <div className="text-xs text-muted-foreground">
          {t("auth.login.signupHint")}{" "}
          <Link to="/signup" className="text-(--color-primary) underline-offset-4 hover:underline">
            {t("auth.login.signupCta")}
          </Link>
        </div>
      </section>
    </main>
  );
}
