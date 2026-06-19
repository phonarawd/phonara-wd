import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Gamepad2,
  LineChart,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { SiteFooter } from "@/components/shell/SiteFooter";
import { fadeUp, stagger } from "@/lib/motion";
import { t } from "@/i18n";

const HOW = [
  { key: "1", icon: Sparkles },
  { key: "2", icon: Gamepad2 },
  { key: "3", icon: LineChart },
] as const;

const TRUST = ["fair", "rg", "kyc"] as const;
const FAQ_KEYS = [1, 2, 3, 4] as const;

export function ImportedLandingPage() {
  return (
    <AppShell bare>
      <div data-testid="landing-page" className="contents">
      <section className="relative isolate overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 60% at 20% 0%, color-mix(in oklab, var(--primary) 30%, transparent), transparent 60%), radial-gradient(50% 50% at 100% 20%, color-mix(in oklab, var(--violet) 28%, transparent), transparent 60%)",
          }}
        />
        <div className="mx-auto flex min-h-[calc(100dvh-160px)] max-w-6xl flex-col items-center justify-center gap-8 px-6 pb-12 pt-10 text-center md:gap-10 md:pt-16">
          <motion.div
            variants={stagger(0.08)}
            initial="hidden"
            animate="show"
            className="flex flex-col items-center gap-6"
          >
            <motion.span
              variants={fadeUp}
              className="inline-flex items-center gap-1.5 rounded-full border border-(--color-primary)/40 bg-(--color-primary)/10 px-3 py-1 text-xs font-medium text-(--color-primary)"
            >
              <Sparkles className="size-3.5" /> {t("landing.hero.badge")}
            </motion.span>

            <motion.h1
              variants={fadeUp}
              className="whitespace-pre-line font-bold leading-[1.05] tracking-tight"
              style={{ fontSize: "var(--text-hero)" }}
            >
              {t("landing.hero.title")}
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="max-w-xl text-base text-muted-foreground md:text-lg"
            >
              {t("landing.hero.subtitle")}
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center"
            >
              <Link
                to="/signup"
                className="flex min-h-14 items-center justify-center gap-2 rounded-xl px-7 text-base font-bold text-(--color-primary-foreground) transition active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring) sm:flex-1"
                style={{
                  backgroundImage: "var(--gradient-cta)",
                  boxShadow: "var(--shadow-glow-cta)",
                }}
              >
                {t("landing.hero.ctaPrimary")} <ArrowRight className="size-5" />
              </Link>
              <Link
                to="/home"
                className="flex min-h-14 items-center justify-center gap-2 rounded-xl border border-border bg-(--color-surface)/60 px-7 text-base font-semibold backdrop-blur transition hover:bg-(--color-surface-elev) sm:flex-1"
              >
                {t("landing.hero.ctaSecondary")}
              </Link>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground"
            >
              {TRUST.map((k) => (
                <span key={k} className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-(--color-primary)" />
                  {t(`landing.trust.${k}`)}
                </span>
              ))}
            </motion.div>
          </motion.div>
          <ChevronDown className="size-4 animate-bounce text-muted-foreground" />
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            {t("landing.howTitle")}
          </h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {HOW.map((s) => (
              <li
                key={s.key}
                className="relative rounded-3xl border border-border bg-(--color-surface) p-6"
              >
                <s.icon className="size-6 text-(--color-primary)" />
                <div className="mt-4 text-xl font-bold">
                  {t(`landing.how.${s.key}.title`)}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t(`landing.how.${s.key}.desc`)}
                </p>
                <CheckCircle2 className="mt-4 size-5 text-(--color-primary)" />
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Tiers + Preview */}
      <section className="border-b border-border bg-(--color-surface)/40">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-20 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-(--color-surface) p-6">
            <h3 className="text-xl font-bold">{t("landing.tiersTitle")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("landing.tiersDesc")}
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-(--color-surface) p-6">
            <h3 className="text-xl font-bold">{t("landing.previewTitle")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("landing.previewDesc")}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link
                to="/casino"
                className="flex items-center gap-2 rounded-xl border border-border bg-(--color-surface-elev) p-3 text-sm"
              >
                <Gamepad2 className="size-4 text-(--color-primary)" /> Games
              </Link>
              <Link
                to="/wallet"
                className="flex items-center gap-2 rounded-xl border border-border bg-(--color-surface-elev) p-3 text-sm"
              >
                <Wallet className="size-4 text-(--color-primary)" /> Wallet
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            {t("landing.trustTitle")}
          </h2>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {TRUST.map((k) => (
              <li
                key={k}
                className="flex items-start gap-3 rounded-2xl border border-border bg-(--color-surface) p-5"
              >
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-(--color-primary)" />
                <span className="text-sm">{t(`landing.trust.${k}`)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-border bg-(--color-surface)/40">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            {t("landing.faqTitle")}
          </h2>
          <div className="mt-8 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-(--color-surface)">
            {FAQ_KEYS.map((n) => (
              <details key={n} className="group">
                <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium hover:bg-(--color-surface-elev)">
                  {t(`faq.q${n}`)}
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground transition group-open:rotate-180" />
                </summary>
                <div className="px-5 pb-5 pt-1 text-sm text-muted-foreground">
                  {t(`faq.a${n}`)}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h2
            className="text-3xl font-bold tracking-tight md:text-5xl"
            style={{
              backgroundImage: "var(--gradient-aurora)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {t("landing.finalCta")}
          </h2>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/signup"
              className="flex min-h-14 items-center justify-center gap-2 rounded-xl px-8 text-base font-bold text-(--color-primary-foreground)"
              style={{
                backgroundImage: "var(--gradient-cta)",
                boxShadow: "var(--shadow-glow-cta)",
              }}
            >
              {t("landing.hero.ctaPrimary")} <ArrowRight className="size-5" />
            </Link>
            <Link
              to="/home"
              className="flex min-h-14 items-center justify-center gap-2 rounded-xl border border-border bg-(--color-surface)/60 px-8 text-base font-semibold"
            >
              {t("landing.hero.ctaSecondary")}
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
      </div>
    </AppShell>
  );
}
