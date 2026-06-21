import { useState, type ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { HomeSideNav } from "@/components/home/HomeSideNav";
import { TopBar } from "./TopBar";
import { GlobalCountdownBanner } from "./GlobalCountdownBanner";
import { PlatformGateBanner } from "./PlatformGateBanner";
import { SupportSheet } from "./SupportSheet";
import { PwaInstallBanner } from "./PwaInstallBanner";
import { SocialProofStrip } from "@/components/social/SocialProofStrip";
import { ActivityDisclosure } from "@/components/social/ActivityDisclosure";

// Mock pre-launch end: 14 days from app load.
const PRELAUNCH_END = Date.now() + 14 * 24 * 60 * 60 * 1000;

export interface AppShellProps {
  children: ReactNode;
  /** "earn" | "app" | "trade" — drives density tokens. */
  density?: "earn" | "app" | "trade";
  /** Hide nav/topbar (Landing). */
  bare?: boolean;
  /** Hide mobile bottom nav (Trade owns its own bottom CTA). */
  hideMobileNav?: boolean;
  assets?: number;
  /** Hide TopBar 총자산 display (e.g. on /home where snapshot card is SOT). */
  hideAssets?: boolean;
  /** Hide outer desktop SideNav (e.g. /home owns its own stake-style sidebar). */
  hideSideNav?: boolean;
  /** Suppress AppShell TopBar below md (/home HomeShellFrame owns mobile chrome). */
  hideMobileTopBar?: boolean;
  /** Wave 1 P0-0 slot: override social-proof strip. Default = <SocialProofStrip />. */
  socialProofSlot?: ReactNode;
}

export function AppShell({
  children,
  density = "app",
  bare = false,
  hideMobileNav = false,
  assets,
  hideAssets = false,
  hideSideNav = false,
  hideMobileTopBar = false,
  socialProofSlot,
}: AppShellProps) {
  // Support sheet state lives in AppShell so AccountSheet "고객센터" row
  // (via TopBar) and BottomNav MoreMenu "고객센터" row (via BottomNav prop)
  // open the same Sheet instance — LOCK L3. FAB removed in Wave 1.3.
  const [supportOpen, setSupportOpen] = useState(false);
  const openSupport = () => setSupportOpen(true);

  if (bare) {
    return (
      <div data-density={density} className="min-h-dvh bg-background text-foreground">
        <GlobalCountdownBanner endsAt={PRELAUNCH_END} />
        {children}
      </div>
    );
  }
  return (
    <div data-density={density} className="min-h-dvh bg-background text-foreground">
      <GlobalCountdownBanner endsAt={PRELAUNCH_END} />
      <div className="flex w-full">
        {!hideSideNav && (
          <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 md:block">
            <HomeSideNav />
          </aside>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className={hideMobileTopBar ? "hidden md:block" : undefined}>
            <TopBar assets={assets} hideAssets={hideAssets} onSupportOpen={openSupport} />
          </div>
          <PlatformGateBanner />
          {socialProofSlot ?? <SocialProofStrip />}
          <main id="main-content" className={hideMobileNav ? "flex-1" : "flex-1 pb-20 md:pb-0"}>
            {children}
          </main>
          <ActivityDisclosure />
        </div>
      </div>
      {!hideMobileNav && <BottomNav onSupportOpen={openSupport} />}
      <SupportSheet open={supportOpen} onOpenChange={setSupportOpen} />
      <PwaInstallBanner />
    </div>
  );
}
