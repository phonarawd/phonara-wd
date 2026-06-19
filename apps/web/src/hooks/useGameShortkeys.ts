import { useEffect } from "react";

export type GameShortkey = "space" | "1" | "2" | "5" | "esc" | "?";

export interface GameShortkeyHandlers {
  onPrimary?: () => void; // Space
  onStakeHalf?: () => void; // 1
  onStakeDouble?: () => void; // 2
  onStakeMax?: () => void; // 5
  onEscape?: () => void; // Esc
  onHelp?: () => void; // ?
}

/**
 * Desktop game shortkeys (Phase 2+ wiring).
 * No-op on touch / when focus is inside an input.
 */
export function useGameShortkeys(handlers: GameShortkeyHandlers, enabled = true) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (t?.isContentEditable) return;
      switch (e.key) {
        case " ":
          if (handlers.onPrimary) {
            e.preventDefault();
            handlers.onPrimary();
          }
          break;
        case "1":
          handlers.onStakeHalf?.();
          break;
        case "2":
          handlers.onStakeDouble?.();
          break;
        case "5":
          handlers.onStakeMax?.();
          break;
        case "Escape":
          handlers.onEscape?.();
          break;
        case "?":
          handlers.onHelp?.();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, handlers]);
}
