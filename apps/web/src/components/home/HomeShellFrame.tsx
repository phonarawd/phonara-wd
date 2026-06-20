import { useState, type ReactNode } from "react";
import { HomeSideNav } from "./HomeSideNav";
import { HomeMobileHeader } from "./HomeMobileHeader";
import { HomeMobileOnlineBar } from "./HomeMobileOnlineBar";

/**
 * L1-16c · Stake-style 2-column shell for /home.
 * PC: fixed 220px dark sidebar + main column.
 * Mobile: header + online bar + drawer; main column full width.
 */
export function HomeShellFrame({ children }: { children: ReactNode }) {
  const [drawer, setDrawer] = useState(false);

  return (
    <div
      data-hub-id="home-shell-frame"
      className="grid w-full grid-cols-1 overflow-x-hidden md:grid-cols-[220px_minmax(0,1fr)]"
    >
      <div className="hidden md:block">
        <div className="sticky top-0 h-dvh">
          <HomeSideNav />
        </div>
      </div>

      <div className="flex min-w-0 flex-col md:col-start-2">
        <HomeMobileHeader onMenuOpen={() => setDrawer(true)} />
        <HomeMobileOnlineBar />

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

        <main className="min-w-0 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
