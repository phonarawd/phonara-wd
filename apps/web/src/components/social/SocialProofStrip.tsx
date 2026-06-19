import { LiveBetsMarquee } from "./LiveBetsMarquee";
import { OnlinePulse } from "./OnlinePulse";
import { useSocialProofPref } from "@/lib/social-proof/preferences";

/**
 * SocialProofStrip — composes Marquee + Pulse for the AppShell slot.
 * - All viewports: marquee row (full width) + pulse row on right.
 * - OFF: DOM removed.
 */
export function SocialProofStrip() {
  const [pref] = useSocialProofPref();
  if (pref === "off") return null;
  return (
    <div data-testid="social-proof-strip" className="border-b border-border">
      <LiveBetsMarquee />
      <div className="flex items-center justify-end px-3 py-1.5">
        <OnlinePulse />
      </div>
    </div>
  );
}
