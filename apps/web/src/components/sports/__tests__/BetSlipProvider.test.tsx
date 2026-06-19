import { describe, expect, it, beforeEach } from "vitest";
import { act, render, renderHook, screen } from "@testing-library/react";
import {
  BetSlipProvider,
  useBetSlip,
  __BETSLIP_GUARDS_INTERNAL__,
} from "../BetSlipProvider";
import { BetSlipPanel } from "../BetSlipPanel";
import type { BetSlipLeg } from "../types";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BetSlipProvider>{children}</BetSlipProvider>
);

function makeLeg(
  i: number,
  fixtureId = "fx-1",
  opts: { marketId?: string; oddsDisplay?: string } = {},
): BetSlipLeg {
  return {
    fixtureId,
    marketId: opts.marketId ?? `${fixtureId}:match_1x2`,
    outcomeId: `o-${i}`,
    selection: "Home",
    oddsDisplay: opts.oddsDisplay ?? "2.00",
    marketType: "match_1x2",
    homeName: "A",
    awayName: "B",
    capturedAt: "2026-06-16T00:00:00Z",
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("BetSlipProvider guards", () => {
  it("B1 — combo mode rejects 9th leg", () => {
    const { result } = renderHook(() => useBetSlip(), { wrapper });
    act(() => result.current.setMode("combo"));
    act(() => {
      for (let i = 0; i < __BETSLIP_GUARDS_INTERNAL__.COMBO_MAX; i++) {
        result.current.toggleLeg(makeLeg(i, `fx-${i}`));
      }
    });
    expect(result.current.legs).toHaveLength(8);
    act(() => result.current.toggleLeg(makeLeg(99, "fx-99")));
    expect(result.current.legs).toHaveLength(8);
  });

  it("B2 — sgp blocks cross-fixture leg", () => {
    const { result } = renderHook(() => useBetSlip(), { wrapper });
    act(() => result.current.setMode("sgp"));
    act(() => result.current.toggleLeg(makeLeg(1, "fx-A")));
    act(() => result.current.toggleLeg(makeLeg(2, "fx-B")));
    expect(result.current.legs).toHaveLength(1);
    expect(result.current.legs[0].fixtureId).toBe("fx-A");
  });

  it("B3 — re-tapping same outcome removes it", () => {
    const { result } = renderHook(() => useBetSlip(), { wrapper });
    const leg = makeLeg(1);
    act(() => result.current.toggleLeg(leg));
    expect(result.current.legs).toHaveLength(1);
    act(() => result.current.toggleLeg(leg));
    expect(result.current.legs).toHaveLength(0);
  });

  it("V3-2 — same fixture+marketId outcome replaces existing leg (1-of-N)", () => {
    const { result } = renderHook(() => useBetSlip(), { wrapper });
    act(() => result.current.toggleLeg(makeLeg(1, "fx-A")));
    act(() => result.current.toggleLeg(makeLeg(2, "fx-A")));
    expect(result.current.legs).toHaveLength(1);
    expect(result.current.legs[0].outcomeId).toBe("o-2");
  });

  it("V3-1 — combinedOddsLabel multiplies decimal strings in combo mode", () => {
    const { result } = renderHook(() => useBetSlip(), { wrapper });
    act(() => result.current.setMode("combo"));
    act(() =>
      result.current.toggleLeg(
        makeLeg(1, "fx-A", { oddsDisplay: "1.85" }),
      ),
    );
    act(() =>
      result.current.toggleLeg(
        makeLeg(2, "fx-B", { oddsDisplay: "2.10" }),
      ),
    );
    expect(result.current.legs).toHaveLength(2);
    expect(result.current.combinedOddsLabel).toBe("3.89");
  });
});

describe("BetSlipPanel testid", () => {
  it("renders sports-slip-place CTA", () => {
    render(
      <BetSlipProvider>
        <BetSlipPanel />
      </BetSlipProvider>,
    );
    const places = screen.getAllByTestId("sports-slip-place");
    expect(places.length).toBeGreaterThanOrEqual(1);
  });
});
