import { Link } from "@tanstack/react-router";
import {
  Bell,
  ChevronRight,
  Download,
  FileText,
  HelpCircle,
  Info,
  Lock,
  Settings,
  ShieldAlert,
  User,
} from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { t } from "@/i18n";

type RouteTo =
  | "/account"
  | "/settings"
  | "/install"
  | "/faq"
  | "/support"
  | "/responsible-gaming"
  | "/about"
  | "/terms"
  | "/privacy";

type Row = { to: RouteTo; icon: typeof User; key: string };

const SECTIONS: { sectionKey: string; rows: Row[] }[] = [
  {
    sectionKey: "account",
    rows: [
      { to: "/account", icon: User, key: "account" },
      { to: "/settings", icon: Settings, key: "settings" },
    ],
  },
  {
    sectionKey: "app",
    rows: [
      { to: "/install", icon: Download, key: "install" },
      { to: "/settings", icon: Bell, key: "notifications" },
    ],
  },
  {
    sectionKey: "help",
    rows: [
      { to: "/faq", icon: HelpCircle, key: "faq" },
      { to: "/support", icon: Info, key: "support" },
      { to: "/responsible-gaming", icon: ShieldAlert, key: "responsibleGaming" },
    ],
  },
  {
    sectionKey: "legal",
    rows: [
      { to: "/about", icon: Info, key: "about" },
      { to: "/terms", icon: FileText, key: "terms" },
      { to: "/privacy", icon: Lock, key: "privacy" },
    ],
  },
];

export function ImportedMorePage() {
  return (
    <AppShell density="app">
      <div className="mx-auto grid max-w-2xl gap-5 p-4 pb-24 md:p-6">
        <header>
          <div className="text-sm text-muted-foreground">{t("more.subtitle")}</div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("more.title")}
          </h1>
        </header>

        {SECTIONS.map((sec) => (
          <section key={sec.sectionKey} className="grid gap-2">
            <h2 className="px-1 text-xs font-medium text-muted-foreground">
              {t(`more.section.${sec.sectionKey}`)}
            </h2>
            <Card>
              <CardContent className="grid gap-1 p-2">
                {sec.rows.map((row) => (
                  <Link
                    key={row.key}
                    to={row.to as '/account'}
                    className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)"
                  >
                    <div className="flex min-h-12 items-center gap-3 rounded-md px-3 hover:bg-(--color-surface-elev)">
                      <row.icon className="size-4 text-muted-foreground" aria-hidden />
                      <span className="flex-1 text-sm">
                        {t(`more.menu.${row.key}`)}
                      </span>
                      <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
