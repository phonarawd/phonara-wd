import { describe, expect, it, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useAdminSportsMock } from "@/hooks/useAdminSportsMock";

beforeEach(() => {
  window.localStorage.clear();
});

describe("useAdminSportsMock", () => {
  it("seeds ≥6 fixtures with at least one high-unsettled row (F3)", () => {
    const { result } = renderHook(() => useAdminSportsMock());
    act(() => {
      result.current.resetForTest();
    });
    expect(result.current.fixtures.length).toBeGreaterThanOrEqual(6);
    expect(
      result.current.fixtures.some((f) => f.unsettledMarkets >= 8),
    ).toBe(true);
    expect(result.current.featureEnabled).toBe(true);
    expect(result.current.exposure.total).toBe("125300000");
    expect(result.current.risk.length).toBeGreaterThanOrEqual(3);
  });

  it("first snapshot equals SEED (hydration-safe; localStorage ignored on first render)", () => {
    window.localStorage.setItem(
      "admin:sports:state:v1",
      JSON.stringify({
        featureEnabled: false,
        fixtures: [],
        suspended: [],
        risk: [],
        exposure: { total: "0", max: "0", openBets: 0 },
        tier: "C",
      }),
    );
    const { result } = renderHook(() => useAdminSportsMock());
    act(() => {
      result.current.resetForTest();
    });
    expect(result.current.fixtures.length).toBeGreaterThanOrEqual(6);
    expect(result.current.featureEnabled).toBe(true);
  });

  it("suspendMarket requires reason ≥4 chars (F1 LOCK)", () => {
    const { result } = renderHook(() => useAdminSportsMock());
    act(() => {
      result.current.resetForTest();
    });
    const fx = result.current.fixtures[0]!;

    act(() => {
      result.current.suspendMarket(fx.id, "ok");
    });
    expect(result.current.suspended.length).toBe(0);

    act(() => {
      result.current.suspendMarket(fx.id, "odds drift");
    });
    expect(result.current.suspended.length).toBe(1);
    expect(result.current.suspended[0]?.fixtureId).toBe(fx.id);
    expect(result.current.suspended[0]?.reason).toBe("odds drift");
  });

  it("setFeatureEnabled flips toggle", () => {
    const { result } = renderHook(() => useAdminSportsMock());
    act(() => {
      result.current.resetForTest();
      result.current.setFeatureEnabled(false);
    });
    expect(result.current.featureEnabled).toBe(false);
    act(() => {
      result.current.setFeatureEnabled(true);
    });
    expect(result.current.featureEnabled).toBe(true);
  });

  it("unsuspendMarket removes entry", () => {
    const { result } = renderHook(() => useAdminSportsMock());
    act(() => {
      result.current.resetForTest();
    });
    const fx = result.current.fixtures[0]!;
    act(() => {
      result.current.suspendMarket(fx.id, "test reason");
    });
    expect(result.current.suspended.length).toBe(1);
    act(() => {
      result.current.unsuspendMarket(fx.id);
    });
    expect(result.current.suspended.length).toBe(0);
  });
});
