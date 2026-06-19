import { useEffect, useState } from "react";
import { fmtCountdown, pad2 } from "@/lib/format";
import { Sparkles, X } from "lucide-react";
import { t } from "@/i18n";

export interface GlobalCountdownBannerProps {
  endsAt: number;
  message?: string;
}

export function GlobalCountdownBanner({
  endsAt,
  message,
}: GlobalCountdownBannerProps) {
  // Initialize at endsAt so SSR + first client render produce identical "00:00:00"
  // (no hydration mismatch). Real countdown starts after mount.
  const [now, setNow] = useState<number>(endsAt);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  if (dismissed) return null;
  const { d, h, m, s } = fmtCountdown(Math.max(0, endsAt - now));
  const label = message ?? t("banner.prelaunch");
  return (
    <div className="flex items-center justify-center gap-3 bg-gradient-to-r from-(--color-primary)/15 via-(--color-gold)/10 to-(--color-primary)/15 px-4 py-1.5 text-xs">
      <Sparkles className="size-3.5 text-(--color-primary)" aria-hidden />
      <span className="text-foreground/90">{label}</span>
      <span className="font-medium tabular-nums text-(--color-primary)">
        {d > 0 && `${d}${t("banner.dayUnit")} `}{pad2(h)}:{pad2(m)}:{pad2(s)}
      </span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={t("banner.close")}
        className="ml-2 text-muted-foreground hover:text-foreground"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
