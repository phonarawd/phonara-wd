import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { SiteFooter } from "@/components/shell/SiteFooter";
import { t } from "@/i18n";

export function ImportedTermsPage() {
  return (
    <AppShell bare>
      <article data-testid="legal-page" className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> {t("legal.common.back")}
        </Link>
        <h1 className="mt-6 text-3xl font-bold tracking-tight md:text-4xl">
          {t("legal.terms.title")}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">{t("legal.terms.updated")}</p>

        <div className="mt-10 space-y-8 text-sm text-foreground/90">
          <Section n={t("legal.terms.s1.n")}>{t("legal.terms.s1.body")}</Section>
          <Section n={t("legal.terms.s2.n")}>{t("legal.terms.s2.body")}</Section>
          <Section n={t("legal.terms.s3.n")}>{t("legal.terms.s3.body")}</Section>
          <Section n={t("legal.terms.s4.n")}>{t("legal.terms.s4.body")}</Section>
          <Section n={t("legal.terms.s5.n")}>{t("legal.terms.s5.body")}</Section>
          <Section n={t("legal.terms.s6.n")}>{t("legal.terms.s6.body")}</Section>
          <Section n={t("legal.terms.s7.n")}>{t("legal.terms.s7.body")}</Section>
        </div>
      </article>
      <SiteFooter />
    </AppShell>
  );
}

function Section({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold">{n}</h2>
      <p className="mt-2 leading-relaxed text-muted-foreground">{children}</p>
    </section>
  );
}
