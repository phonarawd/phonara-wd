import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { SiteFooter } from "@/components/shell/SiteFooter";
import { t } from "@/i18n";

export function ImportedPrivacyPage() {
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
          {t("legal.privacy.title")}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">{t("legal.privacy.lead")}</p>

        <div className="mt-10 space-y-8 text-sm text-foreground/90">
          <Block title={t("legal.privacy.s1.title")}>
            <ul className="list-disc pl-5 text-muted-foreground">
              <li>{t("legal.privacy.s1.item.required")}</li>
              <li>{t("legal.privacy.s1.item.optional")}</li>
              <li>{t("legal.privacy.s1.item.auto")}</li>
            </ul>
          </Block>
          <Block title={t("legal.privacy.s2.title")}>
            <p className="text-muted-foreground">{t("legal.privacy.s2.body")}</p>
          </Block>
          <Block title={t("legal.privacy.s3.title")}>
            <p className="text-muted-foreground">{t("legal.privacy.s3.body")}</p>
          </Block>
          <Block title={t("legal.privacy.s4.title")}>
            <p className="text-muted-foreground">{t("legal.privacy.s4.body")}</p>
          </Block>
          <Block title={t("legal.privacy.s5.title")}>
            <p className="text-muted-foreground">{t("legal.privacy.s5.body")}</p>
          </Block>
          <Block title={t("legal.privacy.s6.title")}>
            <p className="text-muted-foreground">{t("legal.privacy.s6.body")}</p>
          </Block>
        </div>
      </article>
      <SiteFooter />
    </AppShell>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="mt-2 leading-relaxed">{children}</div>
    </section>
  );
}
