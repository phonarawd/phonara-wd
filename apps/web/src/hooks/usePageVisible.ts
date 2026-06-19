import { useEffect, useState } from "react";

/**
 * P1.2 perf — Shared visibility hook.
 *
 * Returns `true` when the page is visible (`document.visibilityState === "visible"`).
 * Server-render returns `true` so SSR HTML matches client first paint.
 * Use as a guard inside timer-driven hooks to stop ticks when the user
 * tabs away — prevents background CPU/animation cost on /casino.
 */
export function usePageVisible(): boolean {
  const [visible, setVisible] = useState<boolean>(true);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const update = () => setVisible(document.visibilityState !== "hidden");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  return visible;
}
