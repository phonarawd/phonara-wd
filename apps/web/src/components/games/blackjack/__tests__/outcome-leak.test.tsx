/**
 * Blackjack · outcome-leak — contract-honest guard.
 *
 * Engine production payload is `{ totalMultiplier }` ONLY. `player`/`dealer`
 * arrays seen in tests/mock pipeline are preview-fallback decoration — Stage
 * MUST NOT fabricate hands from `totalMultiplier`. Banner tier is keyed
 * exclusively off the multiplier (LOSS <1 covers engine `0` LOSE path).
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { render } from "@testing-library/react";
import { Stage } from "../Stage";
import { makeSurfaceProps } from "@/games/__tests__/contractHelpers";

function settledBet(totalMultiplier: string) {
  return {
    bet_id: "b",
    commitment_id: "c",
    amount: "10",
    currency: "PHON",
    status: "settled",
    result: { totalMultiplier },
    payout: "0",
    created_at: new Date().toISOString(),
    settled_at: new Date().toISOString(),
  } as never;
}

describe("Blackjack · outcome-leak (contract-honest)", () => {
  it("renders stage with no bet and no fabricated hand / banner", () => {
    const { container, queryByText } = render(
      <Stage {...makeSurfaceProps("blackjack")} />,
    );
    expect(container.querySelector("[data-testid='casino-stage']")).toBeTruthy();
    expect(container.querySelector("[data-winning]")).toBeNull();
    expect(queryByText(/^(BLACKJACK|WIN|LOSS|PUSH|블랙잭|당첨|패배|푸시)$/)).toBeNull();
  });

  it("totalMultiplier=2.50 → BLACKJACK banner (no fabricated cards)", () => {
    const { container } = render(
      <Stage {...makeSurfaceProps("blackjack", { bet: settledBet("2.50") })} />,
    );
    expect(container.textContent).toMatch(/BLACKJACK|블랙잭/);
    expect(container.textContent).toMatch(/2\.50/);
  });

  it("totalMultiplier=0 → LOSS banner (engine LOSE path covered by <1)", () => {
    const { container } = render(
      <Stage {...makeSurfaceProps("blackjack", { bet: settledBet("0") })} />,
    );
    expect(container.textContent).toMatch(/LOSS|패배/);
  });
});

describe("Blackjack · reduced-motion symbol-visibility", () => {
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

  it("WIN banner shows under reduced-motion (no opacity:0 regression)", () => {
    const { container } = render(
      <Stage {...makeSurfaceProps("blackjack", { bet: settledBet("1.50") })} />,
    );
    expect(container.textContent).toMatch(/WIN|당첨/);
    // No bjFlip animation inline style leaks under reduced motion
    const cards = container.querySelectorAll("[data-bj-card]");
    cards.forEach((c) => {
      const style = (c as HTMLElement).getAttribute("style") ?? "";
      expect(style.includes("bjFlip")).toBe(false);
    });
  });
});
