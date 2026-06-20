import { useEffect, useState } from "react";
import { t } from "@/i18n";
import { useReducedMotionGuard } from "@/components/games/shared/hooks/useReducedMotionGuard";

const DEMO_USERS = ["yuna**", "minho*", "kj***", "park**"] as const;

export function GoldenEarthTapTicker() {
  const reducedMotion = useReducedMotionGuard();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    const id = window.setInterval(() => {
      setIdx((i) => (i + 1) % DEMO_USERS.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, [reducedMotion]);

  const user = DEMO_USERS[idx] ?? DEMO_USERS[0];

  return (
    <p className="truncate text-[11px] text-muted-foreground">
      {t("earn.goldenEarth.ticker.demo", { user })}
    </p>
  );
}

GoldenEarthTapTicker.displayName = "GoldenEarthTapTicker";
