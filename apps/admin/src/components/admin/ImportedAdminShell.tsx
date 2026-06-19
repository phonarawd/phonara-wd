import { type ReactNode, useMemo } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import { useI18n } from "@/lib/i18n";
import { ADMIN_ROUTES, isAdminNavActive } from "@/lib/admin-nav";
import { AdminBottomNav } from "./AdminBottomNav";
import { AdminHotkeyProvider } from "./access/AdminHotkeyProvider";
import { AdminCommandPalette } from "./access/AdminCommandPalette";
import {
  LayoutDashboard,
  Bell,
  Inbox,
  ScrollText,
  ShieldAlert,
  KeyRound,
  Users,
  Settings as SettingsIcon,
  Activity,
  Dices,
  Coins,
  FileText,
} from "lucide-react";

type NavItem = {
  to: string;
  label: string;
  Icon: typeof LayoutDashboard;
  testId: string;
};

export function ImportedAdminShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { locale } = useI18n();

  const nav = useMemo<NavItem[]>(
    () => [
      {
        to: ADMIN_ROUTES.overview,
        label: t("admin.nav.overview"),
        Icon: LayoutDashboard,
        testId: "nav-overview",
      },
      {
        to: ADMIN_ROUTES.alerts,
        label: t("admin.nav.alerts"),
        Icon: Bell,
        testId: "nav-alerts",
      },
      {
        to: ADMIN_ROUTES.queues,
        label: t("admin.nav.queues"),
        Icon: Inbox,
        testId: "nav-queues",
      },
      {
        to: ADMIN_ROUTES.audit,
        label: t("admin.nav.audit"),
        Icon: ScrollText,
        testId: "nav-audit",
      },
      {
        to: ADMIN_ROUTES.operations,
        label: t("admin.nav.operations"),
        Icon: ShieldAlert,
        testId: "nav-operations",
      },
      {
        to: ADMIN_ROUTES.mfaPolicy,
        label: t("admin.nav.mfa"),
        Icon: KeyRound,
        testId: "nav-mfa-policy",
      },
      {
        to: ADMIN_ROUTES.users,
        label: t("admin.nav.users"),
        Icon: Users,
        testId: "nav-users",
      },
      {
        to: ADMIN_ROUTES.settings,
        label: t("admin.nav.settings"),
        Icon: SettingsIcon,
        testId: "nav-settings",
      },
      {
        to: ADMIN_ROUTES.sports,
        label: t("admin.nav.sports"),
        Icon: Activity,
        testId: "nav-sports",
      },
      {
        to: ADMIN_ROUTES.casino,
        label: t("admin.nav.casino"),
        Icon: Dices,
        testId: "nav-casino",
      },
      {
        to: ADMIN_ROUTES.earn,
        label: t("admin.nav.earn"),
        Icon: Coins,
        testId: "nav-earn",
      },
      {
        to: ADMIN_ROUTES.cms,
        label: t("admin.nav.cms"),
        Icon: FileText,
        testId: "nav-cms",
      },
    ],
    [locale],
  );

  return (
    <AdminHotkeyProvider>
      <div className="min-h-dvh bg-background text-foreground">
        <header className="border-b border-border bg-(--color-surface)">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-(--color-primary)/15 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-(--color-primary)">
                admin
              </span>
              <span className="text-sm font-medium">PHONARA</span>
            </div>
            <span
              className="text-[10px] uppercase tracking-wider text-muted-foreground hidden md:inline-flex items-center gap-1"
              data-testid="admin-cmdk-hint"
            >
              <kbd className="rounded border border-border bg-(--color-surface-elev) px-1 py-0.5 font-mono text-[10px]">
                ⌘K
              </kbd>
              <span>{t("admin.command.hint")}</span>
            </span>
          </div>
        </header>
        <div className="mx-auto flex max-w-6xl gap-0 md:gap-4 px-0 md:px-4">
          <aside
            className="hidden w-56 shrink-0 border-r border-border py-4 md:block"
            data-testid="admin-sidebar"
          >
            <nav className="grid gap-0.5 pr-2" aria-label="admin">
              {nav.map((n) => {
                const active = isAdminNavActive(pathname, n.to);
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    data-testid={n.testId}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-(--color-primary)/10 text-foreground"
                        : "text-muted-foreground hover:bg-(--color-surface-elev) hover:text-foreground",
                    )}
                  >
                    <n.Icon className="size-4" aria-hidden />
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
          <main className="min-w-0 flex-1 px-4 py-4 pb-20 md:px-2 md:py-6 md:pb-6">
            {children}
          </main>
        </div>
        <AdminBottomNav />
        <AdminCommandPalette />
      </div>
    </AdminHotkeyProvider>
  );
}
