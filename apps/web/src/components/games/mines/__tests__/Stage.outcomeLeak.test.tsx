/**
 * Mines · §0a OUTCOME-LEAK quarantine — A/B/C matrix.
 *
 * BLOCKING gate. Asserts the engine's `minePositions[]` cannot leak via
 * UNTOUCHED tiles' DOM (outerHTML / attributes / classList) OR React
 * fiber `memoizedProps`.
 *
 * The fiber check is PRE-ASSERTED: if `__reactFiber$*` / `memoizedProps`
 * is not reachable in this environment, the test FAILS explicitly with
 * "fiber inspection unavailable" — never a silent pass.
 *
 * Matrix:
 *   A — settled win, no picked mine        (revealed=[0],     mines=[3,7,12], hit=F)
 *   B — settled bust, one picked mine      (revealed=[0,7],   mines=[3,7,12], hit=T)
 *   C — settled bust, multiple picked mines(revealed=[3,7,12,1], mines=[3,7,12], hit=T)
 */
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { Stage } from "../Stage";
import type { UiBetView } from "@/games/shared/types";

interface Case {
  name: string;
  mineCount: number;
  revealedCells: number[];
  /** Ground-truth layout for leak assertions (may be omitted from bet.result). */
  minePositions: number[];
  hitMine: boolean;
  /** Server-sanitized partial cashout — bet.result omits minePositions. */
  omitClientMinePositions?: boolean;
  /** Tiles expected to show as "bust" face. */
  bust: number[];
  /** Tiles expected to show as "revealed-gem" face. */
  gems: number[];
}

const CASES: Case[] = [
  {
    name: "A · settled win, no picked mine",
    mineCount: 3,
    revealedCells: [0],
    minePositions: [3, 7, 12],
    hitMine: false,
    bust: [],
    gems: [0],
  },
  {
    name: "B · settled bust, one picked mine",
    mineCount: 3,
    revealedCells: [0, 7],
    minePositions: [3, 7, 12],
    hitMine: true,
    bust: [7],
    gems: [0],
  },
  {
    name: "C · settled bust, multiple picked mines",
    mineCount: 3,
    revealedCells: [3, 7, 12, 1],
    minePositions: [3, 7, 12],
    hitMine: true,
    bust: [3, 7, 12],
    gems: [1],
  },
  {
    name: "D · partial cashout sanitized bet (no minePositions in result)",
    mineCount: 3,
    revealedCells: [0],
    minePositions: [3, 7, 12],
    hitMine: false,
    omitClientMinePositions: true,
    bust: [],
    gems: [0],
  },
];

function makeProps(c: Case) {
  const result: { hitMine: boolean; minePositions?: number[] } = { hitMine: c.hitMine };
  if (!c.omitClientMinePositions) {
    result.minePositions = c.minePositions;
  }
  const bet: UiBetView = {
    status: c.hitMine ? "lost" : "won",
    payout: c.hitMine ? "0" : "100",
    result,
  };
  return {
    gameCode: "mines" as const,
    selection: { mineCount: c.mineCount, revealedCells: c.revealedCells },
    bet,
    busy: false,
    clientSeed: "deadbeef",
    commitment: { round_id: "r1", server_seed_hash: "h".repeat(64) },
    verification: null,
    onClientSeedChange: vi.fn(),
    onSelectionChange: vi.fn(),
  };
}

/** Walk a DOM node to its React fiber and return memoizedProps. */
function readFiberProps(node: Element): {
  ok: boolean;
  fiberKey?: string;
  props?: unknown;
  reason?: string;
} {
  const keys = Object.keys(node).filter((k) => k.startsWith("__reactFiber$"));
  if (keys.length === 0) {
    return { ok: false, reason: "fiber inspection unavailable: no __reactFiber$* key" };
  }
  const fiberKey = keys[0]!;
  const fiber = (node as unknown as Record<string, unknown>)[fiberKey] as
    | { memoizedProps?: unknown; return?: unknown }
    | undefined;
  if (!fiber || typeof fiber !== "object") {
    return { ok: false, reason: "fiber inspection unavailable: fiber not an object" };
  }
  if (!("memoizedProps" in fiber)) {
    return { ok: false, reason: "fiber inspection unavailable: no memoizedProps" };
  }
  return { ok: true, fiberKey, props: fiber.memoizedProps };
}

describe("Mines · §0a outcome-leak quarantine", () => {
  it("FIBER PRE-CHECK: __reactFiber$* + memoizedProps must be reachable", () => {
    const { container } = render(<Stage {...makeProps(CASES[0]!)} />);
    const sample = container.querySelector('[aria-label="tile 1"]');
    expect(sample).toBeTruthy();
    const res = readFiberProps(sample!);
    if (!res.ok) {
      throw new Error(res.reason ?? "fiber inspection unavailable");
    }
    expect(res.props).toBeDefined();
  });

  for (const c of CASES) {
    it(c.name, () => {
      const { container } = render(<Stage {...makeProps(c)} />);
      const touched = new Set(c.revealedCells);

      // ----- 1) Per-tile DOM state check -----
      for (let i = 0; i < 25; i++) {
        const tile = container.querySelector(`[aria-label="tile ${i + 1}"]`);
        expect(tile, `tile ${i + 1} must exist`).toBeTruthy();
        const state = tile!.getAttribute("data-tile-state");
        if (c.bust.includes(i)) {
          expect(state, `tile ${i + 1} expected bust`).toBe("bust");
        } else if (c.gems.includes(i)) {
          expect(state, `tile ${i + 1} expected revealed-gem`).toBe("revealed-gem");
        } else if (touched.has(i)) {
          // touched but neither bust nor gem (shouldn't happen in this matrix)
          expect(["picked", "revealed-gem"]).toContain(state);
        } else {
          expect(state, `tile ${i + 1} (untouched) must be hidden`).toBe("hidden");
        }
      }

      // ----- 2) Untouched tiles must NOT leak mine info -----
      for (const mineIdx of c.minePositions) {
        if (touched.has(mineIdx)) continue; // touched-mine = legitimate "bust"
        const tile = container.querySelector(
          `[aria-label="tile ${mineIdx + 1}"]`,
        ) as HTMLElement | null;
        expect(tile).toBeTruthy();
        const html = tile!.outerHTML;
        // No bust class, no mine icon path. Tile must look "hidden".
        expect(tile!.getAttribute("data-tile-state")).toBe("hidden");
        expect(html.toLowerCase()).not.toContain("bust");
        // Lucide Bomb icon uses lucide-bomb class — must be absent on hidden tiles.
        expect(html).not.toContain("lucide-bomb");
        // No data attribute leaking the layout.
        for (const attr of Array.from(tile!.attributes)) {
          expect(attr.name).not.toMatch(/^data-mine/i);
        }
      }

      // ----- 3) Fiber memoizedProps must not contain minePositions / mine indices -----
      const safeStringify = (val: unknown): string => {
        const seen = new WeakSet<object>();
        return JSON.stringify(val, (_k, v) => {
          if (typeof v === "function") return "[fn]";
          if (v && typeof v === "object") {
            if (seen.has(v as object)) return "[circular]";
            seen.add(v as object);
            // Skip DOM nodes & fiber-like nodes to avoid noise but keep
            // own plain-object keys for the props payload.
            if (typeof Node !== "undefined" && v instanceof Node) return "[node]";
            if ("stateNode" in (v as object) && "memoizedProps" in (v as object))
              return "[fiber]";
          }
          return v;
        });
      };

      for (const mineIdx of c.minePositions) {
        if (touched.has(mineIdx)) continue;
        const tile = container.querySelector(
          `[aria-label="tile ${mineIdx + 1}"]`,
        ) as HTMLElement | null;
        const res = readFiberProps(tile!);
        if (!res.ok) throw new Error(res.reason ?? "fiber inspection unavailable");
        const serialized = safeStringify(res.props);
        // The serialized props of an untouched tile must not contain the
        // word "minePositions" nor the full mines array verbatim.
        expect(serialized).not.toContain("minePositions");
        expect(serialized).not.toContain(JSON.stringify(c.minePositions));
      }

    });
  }
});
