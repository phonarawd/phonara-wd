import { describe, expect, it, beforeEach } from "vitest";
import { act, render, renderHook, screen } from "@testing-library/react";
import { BetSlipProvider, useBetSlip } from "../BetSlipProvider";
import { BetSlipSystemMatrix } from "../BetSlipSystemMatrix";
import type { BetSlipLeg } from "../types";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BetSlipProvider>{children}</BetSlipProvider>
);

function makeLeg(i: number, fixtureId = `fx-${i}`): BetSlipLeg {
  return {
    fixtureId,
    marketId: `${fixtureId}:match_1x2`,
    outcomeId: `o-${i}`,
    selection: "Home",
    oddsDisplay: "2.00",
    marketType: "match_1x2",
    homeName: "A",
    awayName: "B",
    capturedAt: "2026-06-16T00:00:00Z",
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("BetSlipSystemMatrix", () => {
  it("S3 — hides matrix and shows coming_soon when legs < 3", () => {
    render(
      <BetSlipProvider>
        <BetSlipSystemMatrix />
      </BetSlipProvider>,
    );
    // chip buttons (K/N) must be absent
    expect(screen.queryByRole("tab")).toBeNull();
  });

  it("S3 — renders C(N,K) and K/N chips for 4 legs", () => {
    function Probe() {
      const { setMode, toggleLeg } = useBetSlip();
      return (
        <>
          <button
            data-testid="seed"
            onClick={() => {
              setMode("system");
              for (let i = 1; i <= 4; i++) toggleLeg(makeLeg(i));
            }}
          />
          <BetSlipSystemMatrix />
        </>
      );
    }
    render(
      <BetSlipProvider>
        <Probe />
      </BetSlipProvider>,
    );
    act(() => {
      screen.getByTestId("seed").click();
    });
    // chips for K=2,3 → 2/4 and 3/4
    expect(screen.getByText("2/4")).toBeTruthy();
    expect(screen.getByText("3/4")).toBeTruthy();
    // C(4,2)=6 visible by default (k=2 after clamp on N=4)
    expect(screen.getByText("6")).toBeTruthy();
  });

  it("S3 — systemK persists across remount", () => {
    const { result, unmount } = renderHook(() => useBetSlip(), { wrapper });
    act(() => {
      for (let i = 1; i <= 4; i++) result.current.toggleLeg(makeLeg(i));
    });
    act(() => result.current.setSystemK(3));
    unmount();
    const { result: r2 } = renderHook(() => useBetSlip(), { wrapper });
    expect(r2.current.systemK).toBe(3);
  });
});
