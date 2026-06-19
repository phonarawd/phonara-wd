import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import { ADMIN_ROUTES, isAdminNavActive } from "@/lib/admin-nav";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Inbox,
  Activity,
  Users,
  MoreHorizontal,
  Bell,
  ScrollText,
  ShieldAlert,
  KeyRound,
  Settings as SettingsIcon,
  Dices,
  Coins,
  FileText,
} from "lucide-react";

type Tab = { to: string; label: string; Icon: typeof LayoutDashboard };

const TABS: Tab[] = [
  { to: ADMIN_ROUTES.overview, label: t("admin.nav.mobile.overview"), Icon: LayoutDashboard },
  { to: ADMIN_ROUTES.queues, label: t("admin.nav.mobile.queue"), Icon: Inbox },
  { to: ADMIN_ROUTES.sports, label: t("admin.nav.mobile.sports"), Icon: Activity },
  { to: ADMIN_ROUTES.users, label: t("admin.nav.mobile.users"), Icon: Users },
];

const MORE: Tab[] = [
  { to: ADMIN_ROUTES.alerts, label: t("admin.nav.alerts"), Icon: Bell },
  { to: ADMIN_ROUTES.audit, label: t("admin.nav.audit"), Icon: ScrollText },
  { to: ADMIN_ROUTES.operations, label: t("admin.nav.operations"), Icon: ShieldAlert },
  { to: ADMIN_ROUTES.casino, label: t("admin.nav.casino"), Icon: Dices },
  { to: ADMIN_ROUTES.earn, label: t("admin.nav.earn"), Icon: Coins },
  { to: ADMIN_ROUTES.cms, label: t("admin.nav.cms"), Icon: FileText },
  { to: ADMIN_ROUTES.mfaPolicy, label: t("admin.nav.mfa"), Icon: KeyRound },
  { to: ADMIN_ROUTES.settings, label: t("admin.nav.settings"), Icon: SettingsIcon },
];

export function AdminBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const moreActive = MORE.some((m) => isAdminNavActive(pathname, m.to));

  return (
    <>
      <nav
        className="sticky bottom-0 z-30 grid grid-cols-5 border-t border-border bg-(--color-surface) pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="admin mobile"
      >
        {TABS.map((tab) => {
          const active = isAdminNavActive(pathname, tab.to);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px]",
                active
                  ? "bg-(--color-primary)/15 text-(--color-primary)"
                  : "text-muted-foreground",
              )}
            >
              <tab.Icon className="size-4" aria-hidden />
              <span className="truncate px-1">{tab.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px]",
            moreActive
              ? "bg-(--color-primary)/15 text-(--color-primary)"
              : "text-muted-foreground",
          )}
          aria-label={t("admin.nav.mobile.more")}
          data-testid="admin-mobile-more"
        >
          <MoreHorizontal className="size-4" aria-hidden />
          <span className="truncate px-1">{t("admin.nav.mobile.more")}</span>
        </button>
      </nav>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85svh] overflow-y-auto rounded-t-2xl border-border bg-(--color-surface) pb-[env(safe-area-inset-bottom)]"
        >
          <SheetHeader className="text-left">
            <SheetTitle>{t("admin.nav.mobile.moreSheet.title")}</SheetTitle>
            <SheetDescription>
              {t("admin.nav.mobile.moreSheet.subtitle")}
            </SheetDescription>
          </SheetHeader>
          <nav className="mt-3 grid gap-1 pb-2" aria-label="admin more">
            {MORE.map((m) => {
              const active = isAdminNavActive(pathname, m.to);
              return (
                <Link
                  key={m.to}
                  to={m.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-3 text-sm",
                    active
                      ? "bg-(--color-primary)/10 text-foreground"
                      : "text-muted-foreground hover:bg-(--color-surface-elev) hover:text-foreground",
                  )}
                >
                  <m.Icon className="size-4" aria-hidden />
                  {m.label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
