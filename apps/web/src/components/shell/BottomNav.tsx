import { useState } from "react";
import { Link, useRouterState } from "@/shims/react-router-dom";
import { Home, Gamepad2, LineChart, Wallet, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";
import { MoreMenu } from "./MoreMenu";

const items = [
  { to: "/home", label: "nav.home", Icon: Home },
  { to: "/casino", label: "nav.games", Icon: Gamepad2 },
  { to: "/trade", label: "nav.trade", Icon: LineChart },
  { to: "/wallet", label: "nav.wallet", Icon: Wallet },
] as const;

const overflowPaths = [
  "/earn",
  "/referral",
  "/leaderboard",
  "/account",
  "/settings",
] as const;

export interface BottomNavProps {
  /** Open the AppShell-owned Support sheet from MoreMenu (LOCK L3). */
  onSupportOpen?: () => void;
}

export function BottomNav({ onSupportOpen }: BottomNavProps = {}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = overflowPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-(--color-surface)/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label={t("shell.bottomnav.aria")}
      >
        <ul className="mx-auto grid max-w-md grid-cols-5">
          {items.map(({ to, label, Icon }) => {
            const active = pathname === to || pathname.startsWith(to + "/");
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={cn(
                    "flex h-14 flex-col items-center justify-center gap-0.5 text-[10px]",
                    active ? "text-(--color-primary)" : "text-muted-foreground",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="size-5" aria-hidden />
                  <span>{t(label)}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              aria-current={moreActive ? "page" : undefined}
              onClick={() => setMoreOpen(true)}
              className={cn(
                "flex h-14 w-full flex-col items-center justify-center gap-0.5 text-[10px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-ring)",
                moreActive ? "text-(--color-primary)" : "text-muted-foreground",
              )}
            >
              <MoreHorizontal className="size-5" aria-hidden />
              <span>{t("nav.more")}</span>
            </button>
          </li>
        </ul>
      </nav>
      <MoreMenu open={moreOpen} onOpenChange={setMoreOpen} onSupportOpen={onSupportOpen} />
    </>
  );
}
