/**
 * Mint Reels · outcome-leak — contract-honest guard.
 *
 * Engine contract exposes ONLY `totalMultiplier` — Stage MUST NOT read
 * `bet.result.grid` (it does not exist). Visual reels are decorative
 * (seedToGrid from public commitment hash), NOT engine truth.
 *
 * Cases:
 *  1. bet=null → 15 symbol cells render, no win banner, no data-winning leak.
 *  2. bet.result.totalMultiplier="12.50" → MEGA banner present, 15 cells.
 *  3. reduced-motion + settled bet → symbols still visible (no slotPop 0% leak).
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { render } from "@testing-library/react";
import { Stage } from "../Stage";
import { makeSurfaceProps } from "@/games/__tests__/contractHelpers";

const SYMBOL_COUNT = 15; // 3 rows × 5 cols

describe("Mint Reels · outcome-leak (contract-honest)", () => {
  it("renders 15 symbol cells with no bet (no fabricated stops)", () => {
    const { container, queryByText } = render(
      <Stage {...makeSurfaceProps("mint_reels")} />,
    );
    const cells = container.querySelectorAll("[data-testid='casino-stage'] .grid-cols-5 > div > div");
    expect(cells.length).toBe(SYMBOL_COUNT);
    expect(queryByText(/MEGA/i)).toBeNull();
    expect(queryByText(/^WIN$/)).toBeNull();
    // No data-winning leak
    expect(container.querySelector("[data-winning]")).toBeNull();
  });

  it("shows MEGA banner only after settle with totalMultiplier >=5", () => {
    const props = makeSurfaceProps("mint_reels", {
      bet: {
        bet_id: "b1",
        commitment_id: "c1",
        amount: "10",
        currency: "PHON",
        status: "settled",
        result: { totalMultiplier: "12.50" },
        payout: "125.00",
        created_at: new Date().toISOString(),
        settled_at: new Date().toISOString(),
      } as never,
    });
    const { container } = render(<Stage {...props} />);
    const cells = container.querySelectorAll("[data-testid='casino-stage'] .grid-cols-5 > div > div");
    expect(cells.length).toBe(SYMBOL_COUNT);
    expect(container.textContent).toMatch(/MEGA|메가/i);
    expect(container.textContent).toMatch(/12\.50/);
  });
});

describe("Mint Reels · reduced-motion symbol-visibility", () => {
  const original = window.matchMedia;
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
    window.matchMedia = original;
  });

  it("keeps symbols visible after settle when reduced-motion is on", () => {
    const props = makeSurfaceProps("mint_reels", {
      bet: {
        bet_id: "b2",
        commitment_id: "c2",
        amount: "10",
        currency: "PHON",
        status: "settled",
        result: { totalMultiplier: "2.00" },
        payout: "20.00",
        created_at: new Date().toISOString(),
        settled_at: new Date().toISOString(),
      } as never,
    });
    const { container } = render(<Stage {...props} />);
    const cells = container.querySelectorAll("[data-testid='casino-stage'] .grid-cols-5 > div > div");
    expect(cells.length).toBe(SYMBOL_COUNT);
    // slotPop must NOT be applied under reduced motion (no `animation` inline style starting with slotPop)
    cells.forEach((cell) => {
      const style = (cell as HTMLElement).getAttribute("style") ?? "";
      expect(style.includes("slotPop")).toBe(false);
    });
  });
});
