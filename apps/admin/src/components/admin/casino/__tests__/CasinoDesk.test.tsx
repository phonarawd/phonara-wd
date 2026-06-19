import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react";
import { useAdminCasinoDeskMock } from "@/hooks/admin/useAdminCasinoDeskMock";
import { CasinoDeskHub } from "@/components/admin/casino/CasinoDeskHub";

beforeEach(() => {
  window.localStorage.clear();
});

function resetHook() {
  const { result } = renderHook(() => useAdminCasinoDeskMock());
  act(() => result.current.resetForTest());
  return result;
}

describe("useAdminCasinoDeskMock — SEED", () => {
  it("T1: catalog SEED ≥10 rows spanning 3 categories with status mix", () => {
    const r = resetHook();
    expect(r.current.catalog.length).toBeGreaterThanOrEqual(10);
    const cats = new Set(r.current.catalog.map((c) => c.category));
    expect(cats.size).toBe(3);
    const live = r.current.catalog.filter((c) => c.status === "live").length;
    const main = r.current.catalog.filter((c) => c.status === "maintenance").length;
    const dis = r.current.catalog.filter((c) => c.status === "disabled").length;
    expect(live).toBeGreaterThanOrEqual(7);
    expect(main).toBeGreaterThanOrEqual(2);
    expect(dis).toBeGreaterThanOrEqual(1);
  });

  it("T2: rtp SEED ≥8 rows with severity + status mix", () => {
    const r = resetHook();
    expect(r.current.rtpReviews.length).toBeGreaterThanOrEqual(8);
    const open = r.current.rtpReviews.filter((x) => x.status === "open").length;
    const crit = r.current.rtpReviews.filter((x) => x.severity === "critical").length;
    const ack = r.current.rtpReviews.filter((x) => x.status === "acknowledged").length;
    const res = r.current.rtpReviews.filter((x) => x.status === "resolved").length;
    expect(open).toBeGreaterThanOrEqual(3);
    expect(crit).toBeGreaterThanOrEqual(1);
    expect(ack).toBeGreaterThanOrEqual(2);
    expect(res).toBeGreaterThanOrEqual(2);
  });
});

describe("useAdminCasinoDeskMock — filters", () => {
  it("T3: catalog filter narrows by category/status/search", () => {
    const r = resetHook();
    act(() => r.current.setCatalogFilters((p) => ({ ...p, category: "table" })));
    expect(r.current.filteredCatalog.every((c) => c.category === "table")).toBe(true);
    act(() => r.current.setCatalogFilters({ search: "crash", category: "all", status: "all" }));
    expect(r.current.filteredCatalog.every((c) => c.gameKey.includes("crash"))).toBe(true);
  });

  it("T4: rtp filter narrows by severity + status", () => {
    const r = resetHook();
    act(() => r.current.setRtpFilters((p) => ({ ...p, severity: "critical" })));
    expect(r.current.filteredRtpReviews.every((x) => x.severity === "critical")).toBe(true);
    act(() => r.current.setRtpFilters({ search: "", severity: "all", status: "open" }));
    expect(r.current.filteredRtpReviews.every((x) => x.status === "open")).toBe(true);
  });
});

describe("useAdminCasinoDeskMock — catalog mutations", () => {
  it("T5: setGameStatus maintenance requires reason ≥4 + audit subject = gameKey", () => {
    const r = resetHook();
    const target = r.current.catalog.find((c) => c.gameKey === "crash")!;
    let ok = true;
    act(() => {
      ok = r.current.setGameStatus(target.id, "maintenance", "no");
    });
    expect(ok).toBe(false);
    expect(r.current.catalog.find((c) => c.id === target.id)!.status).toBe("live");

    act(() => {
      r.current.setGameStatus(target.id, "maintenance", "rotating fairness seed");
    });
    expect(r.current.catalog.find((c) => c.id === target.id)!.status).toBe("maintenance");
    expect(r.current.audit[0]!.subject).toBe("crash");
    expect(r.current.audit[0]!.actionKey).toBe("admin.casino.catalog.audit.maintenance");
  });

  it("T6: bulkSetGameStatus disable gated by reason ≥4", () => {
    const r = resetHook();
    const ids = r.current.catalog
      .filter((c) => c.status === "live")
      .map((c) => c.id);
    let ok = true;
    act(() => {
      ok = r.current.bulkSetGameStatus(ids, "disabled", "x");
    });
    expect(ok).toBe(false);
    act(() => {
      r.current.bulkSetGameStatus(ids, "disabled", "bulk disable test");
    });
    const allDisabled = ids.every(
      (id) => r.current.catalog.find((c) => c.id === id)!.status === "disabled",
    );
    expect(allDisabled).toBe(true);
  });
});

describe("useAdminCasinoDeskMock — rtp mutations", () => {
  it("T7: resolveRtpReview requires reason ≥4 + audit subject = gameKey", () => {
    const r = resetHook();
    const target = r.current.rtpReviews.find((x) => x.status === "open")!;
    let ok = true;
    act(() => {
      ok = r.current.resolveRtpReview(target.id, "no");
    });
    expect(ok).toBe(false);
    expect(r.current.rtpReviews.find((x) => x.id === target.id)!.status).toBe("open");
    act(() => {
      r.current.resolveRtpReview(target.id, "rng audit cleared");
    });
    const after = r.current.rtpReviews.find((x) => x.id === target.id)!;
    expect(after.status).toBe("resolved");
    expect(r.current.audit[0]!.subject).toBe(target.gameKey);
    expect(r.current.audit[0]!.actionKey).toBe("admin.casino.rtp.audit.resolve");
  });

  it("T8: ackRtpReview transitions open→acknowledged · bulkResolve gated", () => {
    const r = resetHook();
    const open = r.current.rtpReviews.find((x) => x.status === "open")!;
    act(() => {
      r.current.ackRtpReview(open.id);
    });
    expect(r.current.rtpReviews.find((x) => x.id === open.id)!.status).toBe(
      "acknowledged",
    );
    const ids = r.current.rtpReviews
      .filter((x) => x.status !== "resolved")
      .map((x) => x.id);
    let ok = true;
    act(() => {
      ok = r.current.bulkResolveRtpReview(ids, "ok");
    });
    expect(ok).toBe(false);
    act(() => {
      r.current.bulkResolveRtpReview(ids, "bulk resolve drift batch");
    });
    const allResolved = ids.every(
      (id) => r.current.rtpReviews.find((x) => x.id === id)!.status === "resolved",
    );
    expect(allResolved).toBe(true);
  });
});

describe("useAdminCasinoDeskMock — isolation", () => {
  it("T9: mutations keep operations + other desk localStorage byte-equal", () => {
    const r = resetHook();
    const keys = [
      "phonara-admin-operations-v1",
      "admin:wallet:withdraw:v1",
      "admin:wallet:deposit:v1",
      "admin:compliance:kyc:v1",
      "admin:users:v1",
      "admin:alerts:v1",
    ];
    for (const k of keys) {
      window.localStorage.setItem(
        k,
        JSON.stringify({ allRows: [], filters: {}, audit: [] }),
      );
    }
    const before = keys.map((k) => window.localStorage.getItem(k));
    act(() => {
      r.current.setGameStatus(
        r.current.catalog[0]!.id,
        "maintenance",
        "isolation test ok",
      );
      r.current.resolveRtpReview(
        r.current.rtpReviews.find((x) => x.status === "open")!.id,
        "isolation test ok",
      );
    });
    const after = keys.map((k) => window.localStorage.getItem(k));
    expect(after).toEqual(before);
  });

  it("T10: no float — string-only display fields", () => {
    const r = resetHook();
    for (const c of r.current.catalog) {
      expect(typeof c.rtpConfigured).toBe("string");
      expect(typeof c.bets24h).toBe("string");
      if (c.rtpObserved24h !== undefined) expect(typeof c.rtpObserved24h).toBe("string");
      if (c.rtpDriftPct !== undefined) expect(typeof c.rtpDriftPct).toBe("string");
    }
    for (const x of r.current.rtpReviews) {
      expect(typeof x.theoreticalRtp).toBe("string");
      expect(typeof x.observedRtp).toBe("string");
      expect(typeof x.driftPct).toBe("string");
      expect(typeof x.sampleSize).toBe("string");
    }
  });
});

describe("CasinoDeskHub", () => {
  it("T11: renders MOCK chip + tab triggers + catalog metrics (Tier C mutations disabled)", () => {
    render(<CasinoDeskHub />);
    expect(screen.getAllByTestId("mock-chip").length).toBeGreaterThan(0);
    expect(screen.getByTestId("casino-tab-catalog")).toBeInTheDocument();
    expect(screen.getByTestId("casino-tab-rtp")).toBeInTheDocument();
    expect(screen.getByTestId("catalog-metric-live")).toBeInTheDocument();
    expect(screen.getByTestId("catalog-metric-maintenance")).toBeInTheDocument();
    expect(screen.getByTestId("catalog-metric-disabled")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("casino-tab-rtp"));
    expect(screen.getByTestId("rtp-metric-open")).toBeInTheDocument();
    expect(screen.getByTestId("rtp-metric-critical")).toBeInTheDocument();
    expect(screen.getByTestId("rtp-metric-resolved")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("casino-tab-catalog"));
    const rows = screen.getAllByTestId(/^catalog-row-cg_/);
    expect(rows.length).toBeGreaterThanOrEqual(10);
    const disableBtn = screen.getAllByTestId(/^catalog-disable-cg_/)[0]!;
    expect((disableBtn as HTMLButtonElement).disabled).toBe(true);
  });
});
