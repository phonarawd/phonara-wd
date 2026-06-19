import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { SiteFooter } from "@/components/shell/SiteFooter";
import { t } from "@/i18n";

export function ImportedAboutPage() {
  return (
    <AppShell bare>
      <InfoPage title={t("legal.about.title")} lead={t("legal.about.lead")}>
        <p dangerouslySetInnerHTML={{ __html: t("legal.about.intro") }} />
        <h3>{t("legal.about.principlesTitle")}</h3>
        <ul>
          <li>{t("legal.about.principle.support")}</li>
          <li>{t("legal.about.principle.kyc")}</li>
          <li>{t("legal.about.principle.rg")}</li>
          <li>{t("legal.about.principle.fee")}</li>
        </ul>
        <h3>{t("legal.about.roadmapTitle")}</h3>
        <p>{t("legal.about.roadmap.body")}</p>
      </InfoPage>
      <SiteFooter />
    </AppShell>
  );
}

function InfoPage({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-6 py-12 md:py-16">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> {t("legal.common.back")}
      </Link>
      <h1 className="mt-6 text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
      {lead && <p className="mt-3 text-base text-muted-foreground md:text-lg">{lead}</p>}
      <div className="prose prose-invert mt-8 max-w-none text-sm text-foreground/90 [&_h3]:mt-8 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:my-1 [&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </article>
  );
}
