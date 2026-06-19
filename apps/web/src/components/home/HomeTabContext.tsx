import { createContext, useContext } from "react";

export type HomeTabId = "today" | "missions" | "rank" | "invite" | "live";
export type HomeRankSub = "weekly" | "vip";

export interface HomeTabCtx {
  setActive: (id: HomeTabId) => void;
  setRankSub: (sub: HomeRankSub) => void;
  rankSub: HomeRankSub;
}

export const HomeTabContext = createContext<HomeTabCtx | null>(null);

export function useHomeTabs(): HomeTabCtx {
  const ctx = useContext(HomeTabContext);
  if (!ctx) {
    // Safe no-op fallback (tests rendering panels in isolation).
    return {
      setActive: () => {},
      setRankSub: () => {},
      rankSub: "weekly",
    };
  }
  return ctx;
}
