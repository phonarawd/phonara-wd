import { useMemo, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { t } from "@/i18n";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { useSignupPageController } from "@/features/auth/use-signup-page-controller";

const LIVE_COUNT = 1284;
const SLOTS_LEFT = 42;

function getStrength(pw: string): { score: 0 | 1 | 2 | 3; label: string } {
  if (pw.length < 6) return { score: 0, label: t("auth.signup.strength.weak") };
  const hasNum = /\d/.test(pw);
  const hasAlpha = /[a-zA-Z]/.test(pw);
  const hasLong = pw.length >= 10;
  const bonus = (hasNum ? 1 : 0) + (hasAlpha ? 1 : 0) + (hasLong ? 1 : 0);
  if (bonus >= 3) return { score: 3, label: t("auth.signup.strength.strong") };
  if (bonus === 2) return { score: 2, label: t("auth.signup.strength.medium") };
  return { score: 1, label: t("auth.signup.strength.weak") };
}

export type ImportedSignupPageProps = {
  engine?: ReturnType<typeof useSignupPageController>;
};

export function ImportedSignupPage({ engine }: ImportedSignupPageProps) {
  const schema = useMemo(
    () =>
      z
        .object({
          email: z.string().email({ message: t("auth.signup.error.email") }),
          password: z
            .string()
            .min(6, { message: t("auth.signup.error.password") }),
          confirm: z.string(),
        })
        .refine((d) => d.password === d.confirm, {
          path: ["confirm"],
          message: t("auth.signup.error.match"),
        }),
    [],
  );

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", confirm: "" },
    mode: "onBlur",
  });

  const password = engine?.password ?? form.watch("password");
  const confirm = engine?.confirm ?? form.watch("confirm");
  const strength = getStrength(password);
  const matchState =
    confirm.length === 0
      ? null
      : password === confirm
        ? "ok"
        : "no";

  const isBusy = engine?.isBusy ?? false;
  const errorMessage = engine?.errorKey ? engine.t(engine.errorKey) : null;

  const onSubmit = () => {
    toast.success(t("auth.signup.success.toast"));
    form.reset();
  };

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    if (engine) {
      void engine.handleSubmit(event);
      return;
    }
    void form.handleSubmit(onSubmit)(event);
  }

  return (
    <main className="min-h-[100dvh] bg-background px-4 py-8 md:py-12">
      <div className="mx-auto grid w-full max-w-5xl gap-8 md:grid-cols-[1.1fr_1fr] md:items-center">
        {/* HERO / SOCIAL PROOF */}
        <section className="grid gap-5">
          {/* Live + slots ticker */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-(--color-surface-elev) px-3 py-1 text-[11px] font-medium text-foreground">
              <span className="relative inline-flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-(--color-destructive) opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-(--color-destructive)" />
              </span>
              {t("auth.signup.live.ticker", { n: LIVE_COUNT.toLocaleString() })}
            </span>
            <span className="inline-flex items-center rounded-full border border-(--color-accent)/40 bg-(--color-accent)/10 px-3 py-1 text-[11px] font-medium text-(--color-accent)">
              {t("auth.signup.slot.bonus", { n: SLOTS_LEFT })}
            </span>
          </div>

          {/* Eyebrow + hero */}
          <div className="grid gap-2">
            <p className="text-xs font-medium tracking-wide text-(--color-primary)">
              {t("auth.signup.eyebrow")}
            </p>
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
              {t("auth.signup.hero.fast")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("auth.signup.subtitle")}
            </p>
          </div>

          {/* Reward chips */}
          <div className="flex flex-wrap gap-2">
            <span
              className="inline-flex items-center rounded-xl px-3 py-2 text-xs font-semibold text-(--color-primary-foreground)"
              style={{
                backgroundImage: "var(--gradient-cta)",
                boxShadow: "var(--shadow-glow-cta)",
              }}
            >
              {t("auth.signup.rewardChip.points")}
            </span>
            <span className="inline-flex items-center rounded-xl border border-(--color-accent)/40 bg-(--color-accent)/10 px-3 py-2 text-xs font-semibold text-(--color-accent)">
              {t("auth.signup.rewardChip.streak")}
            </span>
          </div>

          {/* Trust row */}
          <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">{t("auth.signup.trust.ssl")}</span>
            <span aria-hidden className="text-border">·</span>
            <span className="inline-flex items-center gap-1">{t("auth.signup.trust.pf")}</span>
            <span aria-hidden className="text-border">·</span>
            <span className="inline-flex items-center gap-1">{t("auth.signup.trust.age")}</span>
          </div>
        </section>

        {/* FORM CARD */}
        <section
          className="auth-shell-frame rounded-2xl border border-border bg-(--color-surface-elev) p-5 md:p-6"
          style={{ boxShadow: "var(--shadow-elev-2)" }}
        >
          <Form {...form}>
            <form onSubmit={handleFormSubmit} noValidate className="grid gap-4">
              {errorMessage ? (
                <p className="text-xs text-(--color-destructive)" role="alert" aria-live="polite">
                  {errorMessage}
                </p>
              ) : null}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.signup.email")}</FormLabel>
                    <FormControl>
                      <Input
                        id="signup-email"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        className="min-h-11"
                        disabled={isBusy}
                        {...field}
                        value={engine?.email ?? field.value}
                        onChange={(e) => {
                          if (engine) engine.setEmail(e.target.value);
                          else field.onChange(e);
                        }}
                      />
                    </FormControl>
                    <FormDescription>{t("auth.signup.help.email")}</FormDescription>
                    {!engine ? <FormMessage /> : null}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.signup.password")}</FormLabel>
                    <FormControl>
                      <Input
                        id="signup-password"
                        type="password"
                        autoComplete="new-password"
                        className="min-h-11"
                        disabled={isBusy}
                        {...field}
                        value={engine?.password ?? field.value}
                        onChange={(e) => {
                          if (engine) engine.setPassword(e.target.value);
                          else field.onChange(e);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      <span className="flex items-center justify-between gap-2">
                        <span>{t("auth.signup.help.password")}</span>
                        {password.length > 0 && (
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <StrengthBar score={strength.score} />
                            <span className="text-[11px]">{strength.label}</span>
                          </span>
                        )}
                      </span>
                    </FormDescription>
                    {!engine ? <FormMessage /> : null}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.signup.confirm")}</FormLabel>
                    <FormControl>
                      <Input
                        id="signup-confirm"
                        type="password"
                        autoComplete="new-password"
                        aria-invalid={matchState === "no" || undefined}
                        className="min-h-11"
                        disabled={isBusy}
                        {...field}
                        value={engine?.confirm ?? field.value}
                        onChange={(e) => {
                          if (engine) engine.setConfirm(e.target.value);
                          else field.onChange(e);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      {matchState === "ok" ? (
                        <span className="text-(--color-up)">{t("auth.signup.match.ok")}</span>
                      ) : matchState === "no" ? (
                        <span className="text-(--color-destructive)">{t("auth.signup.match.no")}</span>
                      ) : (
                        t("auth.signup.help.confirm")
                      )}
                    </FormDescription>
                    {!engine ? <FormMessage /> : null}
                  </FormItem>
                )}
              />

              <button
                type="submit"
                disabled={isBusy}
                className="mt-1 flex min-h-12 items-center justify-center rounded-xl text-sm font-bold text-(--color-primary-foreground) transition active:scale-[0.98] disabled:opacity-60"
                style={{
                  backgroundImage: "var(--gradient-cta)",
                  boxShadow: "var(--shadow-glow-cta)",
                }}
              >
                {isBusy ? t("auth.entry.signup.submitting") : t("auth.signup.submit")}
              </button>

              <p className="text-center text-[11px] text-muted-foreground">
                {t("auth.signup.terms")}
              </p>
            </form>
          </Form>

          {/* Funnel next-step (Earn → Casino) */}
          <div className="mt-5 grid gap-2">
            <div className="flex items-center gap-3">
              <span aria-hidden className="h-px flex-1 bg-border" />
              <span className="text-[11px] text-muted-foreground">
                {t("auth.signup.next.title")}
              </span>
              <span aria-hidden className="h-px flex-1 bg-border" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/earn"
                className="flex min-h-11 items-center justify-center rounded-lg border border-(--color-primary)/40 bg-(--color-primary)/10 px-3 text-xs font-semibold text-(--color-primary) transition hover:bg-(--color-primary)/15"
              >
                {t("auth.signup.next.earn")}
              </Link>
              <Link
                to="/casino"
                className="flex min-h-11 items-center justify-center rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground transition hover:bg-(--color-surface-elev)"
              >
                {t("auth.signup.next.casino")}
              </Link>
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-muted-foreground">
            {t("auth.signup.loginHint")}{" "}
            <Link
              to="/login"
              className="font-medium text-(--color-primary) underline-offset-4 hover:underline"
            >
              {t("auth.signup.loginCta")}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function StrengthBar({ score }: { score: 0 | 1 | 2 | 3 }) {
  return (
    <span aria-hidden className="inline-flex gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={
            i < score
              ? score >= 3
                ? "h-1.5 w-3 rounded-sm bg-(--color-up)"
                : score === 2
                  ? "h-1.5 w-3 rounded-sm bg-(--color-accent)"
                  : "h-1.5 w-3 rounded-sm bg-(--color-destructive)"
              : "h-1.5 w-3 rounded-sm bg-border"
          }
        />
      ))}
    </span>
  );
}
