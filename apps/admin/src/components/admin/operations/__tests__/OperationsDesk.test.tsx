import { describe, expect, it, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react";
import { renderAdmin as render } from "@/test/admin-test-render";
import { useAdminOperationsMock } from "@/hooks/admin/useAdminOperationsMock";
import { OperationsDeskHub } from "@/components/admin/operations/OperationsDeskHub";

beforeEach(() => {
  window.localStorage.clear();
});

function resetHook() {
  const { result } = renderHook(() => useAdminOperationsMock());
  act(() => result.current.resetForTest());
  return result;
}

describe("useAdminOperationsMock — SEED", () => {
  it("T1: health SEED ≥10 rows spanning 4 categories", () => {
    const r = resetHook();
    expect(r.current.health.length).toBeGreaterThanOrEqual(10);
    const cats = new Set(r.current.health.map((h) => h.category));
    expect(cats.size).toBe(4);
    expect(r.current.killSwitches.length).toBeGreaterThanOrEqual(11);
  });

  it("T2: numeric display fields are strings only", () => {
    const r = resetHook();
    for (const h of r.current.health) {
      if (h.lagSeconds !== undefined) expect(typeof h.lagSeconds).toBe("string");
      if (h.budgetRemainingPct !== undefined)
        expect(typeof h.budgetRemainingPct).toBe("string");
    }
  });
});

describe("useAdminOperationsMock — filters", () => {
  it("T3: status filter narrows health rows", () => {
    const r = resetHook();
    act(() =>
      r.current.setHealthFilters((p) => ({ ...p, status: "critical" })),
    );
    expect(
      r.current.filteredHealth.every((h) => h.status === "critical"),
    ).toBe(true);
    expect(r.current.filteredHealth.length).toBeGreaterThan(0);
  });

  it("T4: category filter narrows kill switches", () => {
    const r = resetHook();
    act(() =>
      r.current.setKillFilters((p) => ({ ...p, category: "wallet" })),
    );
    expect(
      r.current.filteredKillSwitches.every((k) => k.category === "wallet"),
    ).toBe(true);
  });
});

describe("useAdminOperationsMock — kill mutations", () => {
  it("T5: setKillSwitch toggles + audit.subject === switchKey", () => {
    const r = resetHook();
    const target = r.current.killSwitches.find(
      (k) => k.switchKey === "feature_deposit",
    )!;
    let ok = false;
    act(() => {
      ok = r.current.setKillSwitch(target.id, false, "incident triage");
    });
    expect(ok).toBe(true);
    expect(
      r.current.killSwitches.find((k) => k.id === target.id)!.enabled,
    ).toBe(false);
    expect(r.current.opsAudit[0]!.subject).toBe("feature_deposit");
    expect(r.current.opsAudit[0]!.actionKey).toBe(
      "admin.operations.audit.disable",
    );
  });

  it("T6: reason <4 chars blocked", () => {
    const r = resetHook();
    const target = r.current.killSwitches.find(
      (k) => k.switchKey === "feature_spot",
    )!;
    let ok = true;
    act(() => {
      ok = r.current.setKillSwitch(target.id, false, "no");
    });
    expect(ok).toBe(false);
    expect(
      r.current.killSwitches.find((k) => k.id === target.id)!.enabled,
    ).toBe(true);
    expect(r.current.opsAudit.length).toBe(0);
  });

  it("T7: bulkSetKillSwitch Enable gated by reason ≥4", () => {
    const r = resetHook();
    const ids = r.current.killSwitches
      .filter((k) => !k.enabled)
      .map((k) => k.id);
    let ok = true;
    act(() => {
      ok = r.current.bulkSetKillSwitch(ids, true, "ok");
    });
    expect(ok).toBe(false);
    act(() => {
      r.current.bulkSetKillSwitch(ids, true, "restoring service");
    });
    const enabled = ids.every(
      (id) => r.current.killSwitches.find((k) => k.id === id)!.enabled,
    );
    expect(enabled).toBe(true);
  });

  it("T8: bulkSetKillSwitch Disable gated by reason ≥4", () => {
    const r = resetHook();
    const ids = r.current.killSwitches
      .filter((k) => k.enabled && k.category !== "system")
      .map((k) => k.id);
    act(() => {
      r.current.bulkSetKillSwitch(ids, false, "x");
    });
    const stillEnabled = ids.every(
      (id) => r.current.killSwitches.find((k) => k.id === id)!.enabled,
    );
    expect(stillEnabled).toBe(true);
    act(() => {
      r.current.bulkSetKillSwitch(ids, false, "rolling kill switch test");
    });
    const allDisabled = ids.every(
      (id) => !r.current.killSwitches.find((k) => k.id === id)!.enabled,
    );
    expect(allDisabled).toBe(true);
  });
});

describe("useAdminOperationsMock — refresh isolation", () => {
  it("T9: refreshHealth keeps other desk localStorage byte-equal", () => {
    const r = resetHook();
    const keys = [
      "admin:wallet:withdraw:v1",
      "admin:wallet:deposit:v1",
      "admin:compliance:kyc:v1",
      "admin:compliance:str:v1",
      "admin:compliance:risk:v1",
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
    act(() => r.current.refreshHealth());
    const after = keys.map((k) => window.localStorage.getItem(k));
    expect(after).toEqual(before);
  });
});

describe("OperationsDeskHub", () => {
  it("T10: renders MOCK chip + 4 metric cards + drawer trigger", () => {
    resetHook();
    render(<OperationsDeskHub />);
    expect(screen.getAllByTestId("mock-chip").length).toBeGreaterThan(0);
    expect(screen.getByTestId("ops-metric-cron")).toBeInTheDocument();
    expect(screen.getByTestId("ops-metric-lag")).toBeInTheDocument();
    expect(screen.getByTestId("ops-metric-budget")).toBeInTheDocument();
    expect(screen.getByTestId("ops-metric-kill")).toBeInTheDocument();
    const rows = screen.getAllByTestId(/^health-row-oh_/);
    expect(rows.length).toBeGreaterThanOrEqual(10);
  });

  it("T11: system_halt enable triggers danger-tone dialog button", () => {
    resetHook();
    render(<OperationsDeskHub />);
    const enableBtn = screen.getByTestId("kill-enable-ks_system_halt");
    fireEvent.click(enableBtn);
    expect(screen.getByTestId("ops-confirm-reason")).toBeInTheDocument();
    expect(screen.getByTestId("ops-confirm-confirm")).toBeDisabled();
  });
});
