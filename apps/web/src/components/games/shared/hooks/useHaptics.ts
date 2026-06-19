import { useCallback } from "react";

type Pattern = "tap" | "soft" | "win" | "lose";

const PATTERNS: Record<Pattern, number | number[]> = {
  tap: 8,
  soft: 4,
  win: [18, 40, 18],
  lose: [40],
};

export function useHaptics() {
  return useCallback((pattern: Pattern) => {
    if (typeof navigator === "undefined") return;
    if (typeof navigator.vibrate !== "function") return;
    try {
      navigator.vibrate(PATTERNS[pattern]);
    } catch {
      /* ignore */
    }
  }, []);
}
