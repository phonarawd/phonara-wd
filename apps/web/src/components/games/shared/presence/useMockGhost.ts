import { useEffect, useState } from "react";

export interface GhostPlayer {
  id: string;
  alias: string;
  multiplier: string;
  win: boolean;
}

const ALIASES = ["wanderer", "alpha", "luna", "kite", "echo", "ember", "north", "ronin"];

/** Deterministic-ish mock presence stream. Real WS feed wires in Phase 2+. */
export function useMockGhost(count = 5, tickMs = 2500): GhostPlayer[] {
  const [list, setList] = useState<GhostPlayer[]>(() =>
    Array.from({ length: count }, (_, i) => ({
      id: `ghost-${i}`,
      alias: ALIASES[i % ALIASES.length] ?? "player",
      multiplier: "1.00",
      win: false,
    })),
  );
  useEffect(() => {
    let tick = 0;
    const id = window.setInterval(() => {
      tick += 1;
      setList((prev) =>
        prev.map((g, i) => {
          const m = (1 + ((tick * 7 + i * 3) % 40) / 10).toFixed(2);
          return { ...g, multiplier: m, win: Number(m) >= 2 };
        }),
      );
    }, tickMs);
    return () => window.clearInterval(id);
  }, [tickMs]);
  return list;
}
