import { useState } from "react";
import { t } from "@/i18n";
import { LiveWinMarquee } from "../LiveWinMarquee";
import { LiveActivityFeed } from "../LiveActivityFeed";

type Sub = "wins" | "feed";

const SUBS: ReadonlyArray<{ id: Sub; labelKey: string }> = [
  { id: "wins", labelKey: "home.subtab.liveWins" },
  { id: "feed", labelKey: "home.subtab.feed" },
];

export function HomeLivePanel() {
  const [sub, setSub] = useState<Sub>("wins");
  return (
    <div className="flex flex-col gap-3" data-hub-id="home-live">
      <div role="tablist" className="flex gap-1 rounded-lg border border-border p-1">
        {SUBS.map((s) => (
          <button
            key={s.id}
            role="tab"
            type="button"
            aria-selected={sub === s.id}
            data-subtab-id={s.id}
            onClick={() => setSub(s.id)}
            className={
              "min-h-10 flex-1 rounded-md px-3 text-sm font-medium transition " +
              (sub === s.id
                ? "bg-(--color-primary)/15 text-(--color-primary)"
                : "text-muted-foreground")
            }
          >
            {t(s.labelKey)}
          </button>
        ))}
      </div>
      {sub === "wins" && <LiveWinMarquee />}
      {sub === "feed" && <LiveActivityFeed />}
    </div>
  );
}
