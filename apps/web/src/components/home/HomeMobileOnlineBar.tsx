import { OnlinePulse } from "@/components/social/OnlinePulse";

/**
 * L1-16c · Mobile online pill between header and tabs (Lovable parity).
 */
export function HomeMobileOnlineBar() {
  return (
    <div
      data-hub-id="home-mobile-online-bar"
      data-testid="home-mobile-online-bar"
      className="flex justify-center border-b border-border/60 bg-(--color-surface)/80 px-3 py-2 md:hidden"
    >
      <OnlinePulse />
    </div>
  );
}
