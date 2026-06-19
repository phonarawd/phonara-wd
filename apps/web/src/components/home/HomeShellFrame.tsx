import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { t } from "@/i18n";
import { HomeSideNav } from "./HomeSideNav";

/**
 * L1-16c · Stake-style 2-column shell for /home.
 * PC: fixed 220px dark sidebar + main column.
 * Mobile: hamburger trigger opens drawer; main column full width.
 * Outer AppShell stays — its desktop SideNav is suppressed via hideSideNav.
 */
export function HomeShellFrame({ children }: { children: ReactNode }) {
  const [drawer, setDrawer] = useState(false);

  return (
    <div
      data-hub-id="home-shell-frame"
      className="grid w-full grid-cols-1 overflow-x-hidden md:grid-cols-[220px_minmax(0,1fr)]"
    >
      {/* PC sidebar */}
      <div className="hidden md:block">
        <div className="sticky top-0 h-dvh">
          <HomeSideNav />
        </div>
      </div>

      {/* Mobile hamburger trigger */}
      <button
        type="button"
        aria-label={t("home.side.open")}
        data-testid="home-side-trigger"
        onClick={() => setDrawer(true)}
        className="fixed left-3 top-2 z-40 grid size-10 place-items-center rounded-lg border border-border bg-(--color-surface)/85 text-foreground backdrop-blur md:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      {/* Mobile drawer */}
      {drawer && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 md:hidden"
            onClick={() => setDrawer(false)}
            aria-hidden
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] md:hidden">
            <HomeSideNav drawer onClose={() => setDrawer(false)} />
          </div>
        </>
      )}

      {/* Main column */}
      <main className="min-w-0 overflow-x-hidden">{children}</main>
    </div>
  );
}
