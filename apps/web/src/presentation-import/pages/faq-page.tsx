import { AppShell } from "@/components/shell/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { t } from "@/i18n";
import { Link } from "@tanstack/react-router";

const QA = [
  { q: "faq.q1", a: "faq.a1" },
  { q: "faq.q2", a: "faq.a2" },
  { q: "faq.q3", a: "faq.a3" },
  { q: "faq.q4", a: "faq.a4" },
  { q: "faq.q5", a: "faq.a5" },
  { q: "faq.q6", a: "faq.a6" },
] as const;

export function ImportedFAQPage() {
  return (
    <AppShell density="app">
      <div className="mx-auto grid max-w-3xl gap-5 p-4 md:p-6">
        <header className="grid gap-1">
          <h1 className="text-2xl font-medium">{t("faq.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("faq.subtitle")}</p>
        </header>
        <div className="grid gap-3">
          {QA.map((row) => (
            <Card key={row.q}>
              <CardHeader>
                <CardTitle className="text-base">{t(row.q)}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{t(row.a)}</CardContent>
            </Card>
          ))}
        </div>
        <p className="text-center text-sm">
          {t("faq.contact")}{" "}
          <Link to="/more" className="text-(--color-primary) underline-offset-4 hover:underline">
            /more
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
