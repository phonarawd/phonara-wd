import { describe, expect, it, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react";
import { renderAdmin as render } from "@/test/admin-test-render";
import { useAdminAuditAlertsMock } from "@/hooks/admin/useAdminAuditAlertsMock";
import { AdminAuditHub } from "@/components/admin/audit/AdminAuditHub";
import { AdminAlertsHub } from "@/components/admin/alerts/AdminAlertsHub";

beforeEach(() => {
  window.localStorage.clear();
});

function resetMock() {
  const { result } = renderHook(() => useAdminAuditAlertsMock());
  act(() => result.current.resetForTest());
  return result;
}

describe("useAdminAuditAlertsMock — SEED", () => {
  it("audit feed has ≥20 rows spanning ≥4 domains", () => {
    const r = resetMock();
    expect(r.current.auditFeed.length).toBeGreaterThanOrEqual(20);
    const domains = new Set(r.current.auditFeed.map((e) => e.domain));
    expect(domains.size).toBeGreaterThanOrEqual(4);
  });

  it("alerts seed: ≥2 critical open · ≥2 warning open · ≥2 ack · ≥1 resolved", () => {
    const r = resetMock();
    const a = r.current.alerts;
    expect(
      a.filter((x) => x.severity === "critical" && x.status === "open").length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      a.filter((x) => x.severity === "warning" && x.status === "open").length,
    ).toBeGreaterThanOrEqual(2);
    expect(a.filter((x) => x.status === "acknowledged").length).toBeGreaterThanOrEqual(2);
    expect(a.filter((x) => x.status === "resolved").length).toBeGreaterThanOrEqual(1);
  });
});

describe("useAdminAuditAlertsMock — alerts mutations", () => {
  it("ackAlert: open → acknowledged · audit append · transition only from open", () => {
    const r = resetMock();
    const open = r.current.alerts.find((a) => a.status === "open")!;
    act(() => r.current.ackAlert(open.id));
    expect(
      r.current.alerts.find((a) => a.id === open.id)!.status,
    ).toBe("acknowledged");
    expect(r.current.alertAudit[0]!.actionKey).toBe("admin.alerts.audit.ack");

    // re-ack is a no-op
    const before = r.current.alertAudit.length;
    act(() => r.current.ackAlert(open.id));
    expect(r.current.alertAudit.length).toBe(before);
  });

  it("resolveAlert: requires reason ≥4 · transitions to resolved · audit append", () => {
    const r = resetMock();
    const open = r.current.alerts.find((a) => a.status === "open")!;
    act(() => r.current.resolveAlert(open.id, "abc"));
    expect(r.current.alerts.find((a) => a.id === open.id)!.status).toBe("open");
    act(() => r.current.resolveAlert(open.id, "incident closed"));
    expect(r.current.alerts.find((a) => a.id === open.id)!.status).toBe("resolved");
    expect(r.current.alertAudit[0]!.actionKey).toBe("admin.alerts.audit.resolve");
    expect(r.current.alertAudit[0]!.reason).toBe("incident closed");
  });

  it("bulkAckAlert acks every open id, skips others", () => {
    const r = resetMock();
    const openIds = r.current.alerts
      .filter((a) => a.status === "open")
      .map((a) => a.id);
    act(() => r.current.bulkAckAlert(openIds));
    const stillOpen = r.current.alerts.filter(
      (a) => openIds.includes(a.id) && a.status !== "acknowledged",
    );
    expect(stillOpen.length).toBe(0);
  });

  it("bulkResolveAlert gated by reason ≥4", () => {
    const r = resetMock();
    const ids = r.current.alerts
      .filter((a) => a.status !== "resolved")
      .map((a) => a.id);
    act(() => r.current.bulkResolveAlert(ids, "no"));
    const anyChanged = r.current.alerts.some(
      (a) => ids.includes(a.id) && a.status === "resolved" && a.id !== "al_007",
    );
    expect(anyChanged).toBe(false);
    act(() => r.current.bulkResolveAlert(ids, "all clear"));
    const allResolved = r.current.alerts
      .filter((a) => ids.includes(a.id))
      .every((a) => a.status === "resolved");
    expect(allResolved).toBe(true);
  });
});

describe("useAdminAuditAlertsMock — audit filters", () => {
  it("domain filter narrows feed to chosen domain only", () => {
    const r = resetMock();
    act(() => r.current.setAuditFilters((p) => ({ ...p, domains: ["wallet"] })));
    expect(
      r.current.filteredAuditFeed.every((e) => e.domain === "wallet"),
    ).toBe(true);
    expect(r.current.filteredAuditFeed.length).toBeGreaterThan(0);
  });

  it("refreshAuditFeed is read-only — never writes desk storage keys", () => {
    const r = resetMock();
    window.localStorage.setItem(
      "admin:wallet:withdraw:v1",
      JSON.stringify({
        allRows: [],
        filters: {},
        audit: [
          {
            id: "external-1",
            at: "2026-06-17T10:00:00.000Z",
            actorKey: "admin.primitive.audit.actor.system",
            actionKey: "admin.wallet.audit.withdrawApprove",
            subject: "wd_external",
          },
        ],
      }),
    );
    const before = window.localStorage.getItem("admin:wallet:withdraw:v1");
    act(() => r.current.refreshAuditFeed());
    const after = window.localStorage.getItem("admin:wallet:withdraw:v1");
    expect(after).toBe(before);
    expect(
      r.current.auditFeed.some((e) => e.id === "external-1"),
    ).toBe(true);
  });
});

describe("AdminAuditHub", () => {
  it("renders MOCK chip, refresh button, and feed rows", () => {
    resetMock();
    render(<AdminAuditHub />);
    expect(screen.getAllByTestId("mock-chip").length).toBeGreaterThan(0);
    expect(screen.getByTestId("audit-feed-refresh")).toBeInTheDocument();
    const rows = screen.getAllByTestId(/^audit-row-af_/);
    expect(rows.length).toBeGreaterThanOrEqual(20);
  });
});

describe("AdminAlertsHub", () => {
  it("renders MOCK chip + 3 metric cards", () => {
    resetMock();
    render(<AdminAlertsHub />);
    expect(screen.getAllByTestId("mock-chip").length).toBeGreaterThan(0);
    expect(screen.getByTestId("alerts-metric-crit")).toBeInTheDocument();
    expect(screen.getByTestId("alerts-metric-warn")).toBeInTheDocument();
    expect(screen.getByTestId("alerts-metric-ack")).toBeInTheDocument();
  });

  it("ack button on an open row triggers transition", () => {
    resetMock();
    const openId = renderHook(() => useAdminAuditAlertsMock()).result.current
      .alerts.find((a) => a.status === "open")!.id;
    render(<AdminAlertsHub />);
    fireEvent.click(screen.getByTestId(`alert-ack-${openId}`));
    fireEvent.change(screen.getByTestId("admin-alert-action-reason"), {
      target: { value: "acknowledged in drill" },
    });
    fireEvent.click(screen.getByTestId("admin-alert-action-confirm"));
    const { result } = renderHook(() => useAdminAuditAlertsMock());
    expect(result.current.alerts.find((a) => a.id === openId)!.status).toBe(
      "acknowledged",
    );
  });
});
