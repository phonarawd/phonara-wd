import { AppShell } from "@/components/shell/AppShell";
import { HomeShellFrame } from "@/components/home/HomeShellFrame";
import { HomeWalletSnapshotCard } from "@/components/home/HomeWalletSnapshotCard";
import { HomeTabShell } from "@/components/home/HomeTabShell";

/**
 * L1-16 — /home Hub variant (today · missions · rank · invite · live).
 */
export function ImportedHomePage() {
  return (
    <AppShell
      density="app"
      hideAssets
      hideSideNav
    >
      <HomeShellFrame>
        <div
          className="grid min-w-0 gap-3 px-3 pb-4 pt-3 md:gap-4 md:p-6 md:pb-6 md:pt-6"
          data-testid="dashboard-page"
        >
          {/* L1-16b desktop SOT · mobile uses compact strip inside today tab (L1-16c). */}
          <div className="hidden md:block">
            <HomeWalletSnapshotCard />
          </div>
          <HomeTabShell />
        </div>
      </HomeShellFrame>
    </AppShell>
  );
}
