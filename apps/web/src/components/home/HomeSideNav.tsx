import { Link, useRouterState } from "@/shims/react-router-dom";
import {
  Home,
  Gamepad2,
  LineChart,
  Wallet,
  Goal,
  Gift,
  Search,
  X,
} from "lucide-react";
import { t } from "@/i18n";
import { cn } from "@/lib/utils";

// L1-16e · Slimmed to 5 page-level destinations.
// /games entry removed ??it just redirected to /casino (duplicate label).
// Wave 6bR · /earn tail-appended (desktop earn discoverability; mobile contract unchanged).
const NAV = [
  { to: "/home", labelKey: "home.side.nav.home", Icon: Home },
  { to: "/casino", labelKey: "home.side.nav.casino", Icon: Gamepad2 },
  { to: "/sports", labelKey: "home.side.nav.sports", Icon: Goal },
  { to: "/trade", labelKey: "home.side.nav.trade", Icon: LineChart },
  { to: "/wallet", labelKey: "home.side.nav.wallet", Icon: Wallet },
  { to: "/earn", labelKey: "home.side.nav.earn", Icon: Gift },
] as const;


export interface HomeSideNavProps {
  /** Mobile drawer mode: shows close button at top. */
  drawer?: boolean;
  onClose?: () => void;
}

export function HomeSideNav({ drawer = false, onClose }: HomeSideNavProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside
      data-hub-id="home-side-nav"
      data-testid="home-side-nav"
      className={cn(
        "flex h-full w-full flex-col gap-3 border-r border-border bg-(--color-surface) px-3 py-4",
        drawer ? "" : "min-h-[calc(100dvh-3.5rem)]",
      )}
    >
      <div className="flex items-center justify-between px-1">
        {/* L1-16e MAJOR-1 fix: brand is decorative; /home entry lives in NAV below. */}
        <div className="flex items-center gap-2 text-base font-semibold text-foreground">
          <span className="text-(--color-primary)">◆</span>
          <span>{t("home.side.brand")}</span>
        </div>

        {drawer && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t("home.side.close")}
            className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-(--color-surface-elev)"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      <label className="relative flex items-center">
        <Search className="absolute left-3 size-4 text-muted-foreground" aria-hidden />
        <input
          type="search"
          data-testid="home-side-search"
          placeholder={t("home.side.search.placeholder")}
          className="h-10 w-full rounded-lg border border-border bg-(--color-background)/60 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-2 focus:outline-(--color-primary)"
        />
      </label>

      <nav aria-label={t("home.side.brand")} className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
        {NAV.map(({ to, labelKey, Icon }) => {
          const active = pathname === to || pathname.startsWith(to + "/");
          return (
            <Link
              key={to}
              to={to}
              data-side-nav-item={to}
              data-active={active ? "true" : "false"}
              onClick={onClose}
              className={cn(
                "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                active
                  ? "bg-(--color-primary)/15 text-(--color-primary)"
                  : "text-foreground/80 hover:bg-(--color-surface-elev) hover:text-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{t(labelKey)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-lg border border-border/60 bg-gradient-to-br from-(--color-primary)/10 to-transparent p-3 text-[11px] text-muted-foreground">
        <p className="font-semibold text-foreground">{t("home.side.promo.title")}</p>
        <p className="mt-0.5">{t("home.side.promo.desc")}</p>
      </div>
    </aside>
  );
}
