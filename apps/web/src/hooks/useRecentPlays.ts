import { useCallback, useEffect, useState } from "react";
import type { CasinoGameId } from "@/data/casino-game-meta";

/**
 * P1.4 — Recent plays (localStorage-backed, SSR safe).
 *
 * Stores last 8 played game IDs under `phonara.casino.recent`. Read happens
 * post-mount via useEffect so SSR HTML matches first client paint (always
 * empty list initially). Push de-duplicates and trims to MAX.
 */

export const RECENT_KEY = "phonara.casino.recent";
const MAX = 8;

function readSafe(): CasinoGameId[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x): x is CasinoGameId => typeof x === "string")
      .slice(0, MAX);
  } catch {
    return [];
  }
}

function writeSafe(ids: readonly CasinoGameId[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(ids.slice(0, MAX)));
  } catch {
    /* quota / privacy mode — silent */
  }
}

export function useRecentPlays() {
  const [ids, setIds] = useState<CasinoGameId[]>([]);

  useEffect(() => {
    setIds(readSafe());
  }, []);

  const push = useCallback((id: CasinoGameId) => {
    setIds((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, MAX);
      writeSafe(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setIds([]);
    writeSafe([]);
  }, []);

  return { ids, push, clear };
}

/** Direct push helper for callers that don't need state subscription. */
export function pushRecentPlay(id: CasinoGameId) {
  const cur = readSafe();
  const next = [id, ...cur.filter((x) => x !== id)].slice(0, MAX);
  writeSafe(next);
}
