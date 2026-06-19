/**
 * Mines · prefers-reduced-motion (motion strip) — sibling test.
 *
 * Asserts that under `matchMedia("(prefers-reduced-motion: reduce)") = true`:
 *   - tiles' inner flip surface does NOT carry the rotateY transition class,
 *   - bust shake / sparkle / idle animation classes are NOT applied,
 *   - reveal state, picked count, multiplier numbers still render.
 *
 * Existing `reducedMotion.test.tsx` (render-smoke) is left untouched.
 */
import { describe, expect, it, beforeAll, afterAll, vi } from "vitest";
import { render } from "@testing-library/react";
import { Stage } from "../Stage";
import type { UiBetView } from "@/games/shared/types";

const originalMatchMedia = window.matchMedia;

function makeProps() {
  const bet: UiBetView = {
    status: "won",
    payout: "100",
    result: { minePositions: [3, 7, 12], hitMine: false },
  };
  return {
    gameCode: "mines" as const,
    selection: { mineCount: 3, revealedCells: [0, 1] },
    bet,
    busy: false,
    clientSeed: "deadbeef",
    commitment: { round_id: "r1", server_seed_hash: "h".repeat(64) },
    verification: null,
    onClientSeedChange: vi.fn(),
    onSelectionChange: vi.fn(),
  };
}

describe("Mines · Stage under prefers-reduced-motion", () => {
  beforeAll(() => {
    window.matchMedia = (q: string) =>
      ({
        matches: q.includes("reduce"),
        media: q,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList;
  });
  afterAll(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("strips flip/shake/sparkle/idle classes; reveal + numbers survive", () => {
    const { container } = render(<Stage {...makeProps()} />);
    const html = container.innerHTML;

    // Motion classes must NOT be present under reduce.
    expect(html).not.toContain("animate-tile-shake");
    expect(html).not.toContain("animate-tile-sparkle");
    expect(html).not.toContain("animate-tile-idle");
    expect(html).not.toContain("[transform:rotateY(180deg)]");
    expect(html).not.toContain("transition-transform");

    // Reveal state still resolved.
    const tile1 = container.querySelector('[aria-label="tile 1"]');
    expect(tile1?.getAttribute("data-tile-state")).toBe("revealed-gem");

    // Numbers (multiplier strip) still rendered.
    expect(html).toMatch(/\d+\.\d{2}×/);
  });
});
