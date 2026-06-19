/**
 * Roulette · prefers-reduced-motion guard.
 * Wheel spin transform MUST be removed under reduce; fade-only allowed.
 */
import { describe, expect, it, beforeAll, afterAll, vi } from "vitest";
import { render } from "@testing-library/react";
import { ImportedRouletteGame } from "..";
import { makeSurfaceProps } from "@/games/__tests__/contractHelpers";

const original = window.matchMedia;

describe("Roulette · prefers-reduced-motion", () => {
  beforeAll(() => {
    window.matchMedia = vi.fn((q: string) => ({
      matches: q.includes("reduce"),
      media: q,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;
  });
  afterAll(() => {
    window.matchMedia = original;
  });

  it("renders without throwing under reduced motion", () => {
    const { container } = render(
      <ImportedRouletteGame {...makeSurfaceProps("roulette")} />,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it("svg has NO rotate transform when reduced + winning set (fade-only)", () => {
    const props = makeSurfaceProps("roulette", {
      bet: {
        status: "won",
        payout: "20",
        result: { winningNumber: 17, totalMultiplier: "2.00" },
        multiplier: "2.00",
      },
    });
    const { getByTestId } = render(<ImportedRouletteGame {...props} />);
    const svg = getByTestId("roulette-wheel-svg");
    expect(svg).toBeTruthy();
    const style = svg.getAttribute("style") ?? "";
    expect(style).not.toMatch(/transform\s*:\s*rotate/);
    expect(style).toMatch(/opacity/);
  });
});
